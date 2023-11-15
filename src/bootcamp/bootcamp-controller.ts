import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { ObjectId, WithId } from 'mongodb';

import geocoder from '../utils/geocoder.js';
import {
  BootcampCreateDto,
  BootcampPopulated,
  BootcampUpdateDto,
  Bootcamps,
} from './bootcamp-model.js';
import {
  execCreateBootcamp,
  execUpdateBootcamp,
  execRegisterForBootcamp,
  execDeleteBootcamp,
  getPopulatedBootcamps,
} from './bootcamp-service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ObjectIdParam } from '../types/object-id.type.js';
import { ResponseCT } from '../types/response-custom-type.type.js';
import { checkLoggedUser } from '../utils/check-user-set.js';
import { Users } from '../user/user-model.js';

// @desc  Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
export const getBootcamps = asyncHandler(
  async (req: Request, res: ResponseCT, next: NextFunction) => {
    res.status(200).json(res.advancedResults);
  }
);

// @desc  Get single bootcamp
// @route GET /api/v1/bootcamps/:id
// @access Public
export const getBootcamp = asyncHandler(
  async (
    req: Request<ObjectIdParam>,
    res: ResponseCT<{ data: BootcampPopulated }>,
    next: NextFunction
  ) => {
    const bootcampId = new ObjectId(req.params.id);
    const [bootcamp] = await getPopulatedBootcamps({ _id: bootcampId });

    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${bootcampId}`, 404)
      );
    }

    res.status(200).json({ success: true, data: bootcamp });
  }
);

// @desc  Create bootcamp
// @route POST /api/v1/bootcamps
// @access Private
export const createBootcamp = asyncHandler(
  async (
    req: Request<{}, {}, BootcampCreateDto>,
    res: ResponseCT<{ data: WithId<BootcampPopulated> }>,
    next
  ) => {
    const loggedUser = checkLoggedUser(req);

    // check no other bootcamp is published yet (max 1 bootcamp per owner)
    const ownerId = loggedUser._id;
    const publishedBootcamp = await Bootcamps.findOne({
      owner: { _id: ownerId },
    });

    if (publishedBootcamp && loggedUser.role !== 'admin') {
      return next(
        new ErrorResponse(
          `The user with id ${ownerId} has already published a bootcamp`,
          400
        )
      );
    }

    const result = await execCreateBootcamp(req.body, loggedUser);

    res.status(201).json({ success: true, data: result });
  }
);

// @desc  Update bootcamp
// @route POST /api/v1/bootcamps/:id
// @access Private
export const updateBootcamp = asyncHandler(
  async (
    req: Request<{ id: string }, {}, BootcampUpdateDto>,
    res: ResponseCT<{ data: WithId<BootcampPopulated> }>,
    next
  ) => {
    const bootcampId = new ObjectId(req.params.id);
    let bootcamp = await Bootcamps.findOne({
      _id: bootcampId,
    });
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 400)
      );
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && bootcamp.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id.toString()} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    const result = await execUpdateBootcamp(req.body, bootcamp);

    res.status(200).json({ success: true, data: result });
  }
);

// @desc  Register for bootcamp
// @route POST /api/v1/bootcamps/:id/register
// @access Private
export const registerForBootcamp = asyncHandler(
  async (
    req: Request<{ id: string }, {}, { user: string }>,
    res: ResponseCT<{ data: WithId<BootcampPopulated> }>,
    next: NextFunction
  ) => {
    const bootcampId = new ObjectId(req.params.id);
    let bootcamp = await Bootcamps.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${bootcampId}`, 400)
      );
    }
    const userId = new ObjectId(req.body.user);
    const user = await Users.findOne({ _id: userId });
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${userId}`, 400)
      );
    }

    if (bootcamp.participants.includes(userId)) {
      return next(
        new ErrorResponse(
          `User ${user.email} already registered for bootcamp ${bootcampId}`,
          400
        )
      );
    }

    const result = await execRegisterForBootcamp(bootcampId, userId);

    res.status(200).json({ success: true, data: result });
  }
);

// @desc  Delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Private
export const deleteBootcamp = asyncHandler(
  async (req: Request<{ id: string }>, res: Response, next) => {
    const bootcampId = new ObjectId(req.params.id);
    const bootcamp = await Bootcamps.findOne({ _id: bootcampId });
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${bootcampId}`, 400)
      );
    }
    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && bootcamp.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to delete this bootcamp`,
          401
        )
      );
    }

    await execDeleteBootcamp(bootcamp);

    res.status(204).send();
  }
);

// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
export const getBootcampsInRadius = asyncHandler(
  async (
    req: Request<{ zipcode: number; distance: number }>,
    res: ResponseCT<{
      count: number;
      data: WithId<BootcampPopulated>[];
    }>,
    next: NextFunction
  ) => {
    const { zipcode, distance } = req.params;

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode.toString());
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963;

    const filterCond = {
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    };
    const bootcamps = await getPopulatedBootcamps(filterCond);

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  }
);

// @desc  Upload photo for bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
export const bootcampPhotoUpload = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: string }>,
    next: NextFunction
  ) => {
    const bootcampId = new ObjectId(req.params.id);
    const bootcamp = await Bootcamps.findOne(bootcampId);
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${bootcampId}`, 404)
      );
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && bootcamp.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    if (!req.files) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;
    if (file instanceof Array) {
      return next(new ErrorResponse(`Please upload a single file`, 400));
    }

    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    const maxSize = process.env.MAX_FILE_UPLOAD;
    if (file.size > Number.parseInt(maxSize!, 10)) {
      return next(
        new ErrorResponse(`Please upload an image less than ${maxSize}`, 400)
      );
    }

    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }
      await Bootcamps.findOneAndUpdate(
        { _id: bootcampId },
        { $set: { photo: file.name } }
      );
      res.status(200).json({ success: true, data: file.name });
    });
  }
);
