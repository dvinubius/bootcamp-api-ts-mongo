import { Request, Response, NextFunction } from 'express';
import { ObjectId, WithId } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ResponseCT } from '../types/response-custom-type.type.js';
import { checkLoggedUser } from '../utils/check-user-set.js';
import {
  CourseCreateDto,
  CoursePopulated,
  CourseUpdateDto,
  Courses,
} from './course-model.js';
import {
  execCreateCourse,
  execDeleteCourse,
  execUpdateCourse,
  getPopulatedCourses,
} from './course-service.js';
import { Bootcamps } from '../bootcamp/bootcamp-model.js';

// @desc  Get all courses
// @route GET /api/v1/courses
// @access Public
export const getCourses = asyncHandler(
  async (req: Request, res: ResponseCT, next: NextFunction) => {
    res.status(200).json(res.advancedResults);
  }
);

// @desc  Get all courses for a bootcamp
// @route GET /api/v1/bootcamp/:id/courses
// @access Public
export const getCoursesForBootcamp = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: WithId<CoursePopulated>[]; count: number }>,
    next: NextFunction
  ) => {
    const bootcampIdStr = new ObjectId(req.params.id);
    if (!bootcampIdStr) {
      return next(
        new ErrorResponse(
          'No bootcamp id provided. Please provide a bootcamp id',
          400
        )
      );
    }

    const filterCond = { bootcamp: { _id: new ObjectId(bootcampIdStr) } };
    const courses = await getPopulatedCourses(filterCond);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  }
);

// @desc  Get single course
// @route GET /api/v1/courses/:id
// @access Public
export const getCourse = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: WithId<CoursePopulated> }>,
    next: NextFunction
  ) => {
    const courseId = new ObjectId(req.params.id);
    const [course] = await getPopulatedCourses({ _id: courseId }); // select: 'name description',

    if (!course) {
      return next(
        new ErrorResponse(`Course not found with id of ${courseId}`, 404)
      );
    }
    res.status(200).json({ success: true, data: course });
  }
);

// @desc  Add course to bootcamp
// @route POST /api/v1/bootcamps/:id/courses
// @access Private
export const addCourse = asyncHandler(
  async (
    req: Request<{ id?: string }, {}, CourseCreateDto>,
    res: ResponseCT<{ data: WithId<CoursePopulated> }>,
    next: NextFunction
  ) => {
    const loggedUser = checkLoggedUser(req);
    const bootcampId = new ObjectId(req.params.id);
    const bootcamp = await Bootcamps.findOne({ _id: bootcampId });

    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404)
      );
    }

    if (loggedUser.role !== 'admin' && bootcamp.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
          401
        )
      );
    }

    const course = await execCreateCourse(req.body, bootcamp, loggedUser);

    res.status(201).json({ success: true, data: course });
  }
);

// @desc  Update course
// @route PUT /api/v1/courses/:id
// @access Private
export const updateCourse = asyncHandler(
  async (
    req: Request<{ id: string }, {}, CourseUpdateDto>,
    res: ResponseCT<{ data: WithId<CoursePopulated> }>,
    next: NextFunction
  ) => {
    const courseId = new ObjectId(req.params.id);
    const course = await Courses.findOne({ _id: courseId });

    if (!course) {
      return next(new ErrorResponse(`No course with id ${courseId}`, 404));
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && course.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to update course ${course._id}`,
          401
        )
      );
    }

    const result = await execUpdateCourse(course, req.body);
    res.status(200).json({ success: true, data: result });
  }
);

// @desc  Delete course
// @route DELTE /api/v1/courses/:id
// @access Private
export const deleteCourse = asyncHandler(
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const courseId = new ObjectId(req.params.id);
    let course = await Courses.findOne(courseId);

    if (!course) {
      return next(new ErrorResponse(`No course with id ${courseId}`, 404));
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && course.owner !== loggedUser._id) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to delete course ${course._id}`,
          401
        )
      );
    }

    await execDeleteCourse(course);
    res.status(204).send();
  }
);
