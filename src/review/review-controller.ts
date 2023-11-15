import { Request, Response, NextFunction } from 'express';
import { ObjectId, WithId } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ResponseCT } from '../types/response-custom-type.type.js';
import { checkLoggedUser } from '../utils/check-user-set.js';
import { Bootcamps } from '../bootcamp/bootcamp-model.js';
import {
  Review,
  ReviewCreateDto,
  ReviewPopulated,
  ReviewUpdateDto,
  Reviews,
} from './review-model.js';
import {
  execCreateReview,
  execDeleteReview,
  execUpdateReview,
  getPopulatedReviews,
} from './review-service.js';

// @desc  Get all reviews
// @route GET /api/v1/reviews
// @access Public
export const getReviews = asyncHandler(
  async (
    req: Request,
    res: ResponseCT<{ data: Review[] }>,
    next: NextFunction
  ) => {
    res.status(200).json(res.advancedResults);
  }
);

// @desc  Get all reviews for a bootcamp
// @route GET /api/v1/bootcamps/:id/reviews/
// @access Public
export const getReviewsForBootcamp = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: WithId<ReviewPopulated>[]; count: number }>,
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
    const reviews = await getPopulatedReviews(filterCond);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  }
);

// @desc  Get single review
// @route GET /api/v1/reviews/:id
// @access Public
export const getReview = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: WithId<ReviewPopulated> }>,
    next
  ) => {
    const reviewId = new ObjectId(req.params.id);
    const [review] = await getPopulatedReviews({ _id: reviewId });
    if (!review) {
      return next(
        new ErrorResponse(`Review not found with id of ${reviewId}`, 404)
      );
    }

    res.status(200).json({ success: true, data: review });
  }
);

// @desc  Add review to bootcamp
// @route POST /api/v1/bootcamps/:id/reviews
// @access Private
export const addReview = asyncHandler(
  async (
    req: Request<{ id: string }, {}, ReviewCreateDto>,
    res: ResponseCT<{ data: WithId<ReviewPopulated> }>,
    next: NextFunction
  ) => {
    const bootcampId = new ObjectId(req.params.id);
    const bootcamp = await Bootcamps.findOne({ _id: bootcampId });
    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404)
      );
    }

    const loggedUser = checkLoggedUser(req);
    const authorId = loggedUser._id;
    const isParticipant = bootcamp.participants.includes(authorId);

    if (loggedUser.role !== 'admin' && !isParticipant) {
      return next(
        new ErrorResponse(
          `User ${authorId} is not authorized to add a review to bootcamp ${bootcampId}`,
          401
        )
      );
    }

    const review = await execCreateReview(req.body, bootcamp, loggedUser);

    res.status(201).json({ success: true, data: review });
  }
);

// @desc  Update review
// @route PUT /api/v1/reviews/:id
// @access Private
export const updateReview = asyncHandler(
  async (
    req: Request<{ id: string }, {}, ReviewUpdateDto>,
    res: ResponseCT<{ data: WithId<ReviewPopulated> }>,
    next
  ) => {
    const reviewId = new ObjectId(req.params.id);
    const review = await Reviews.findOne(reviewId);
    const bootcampId = review!.bootcamp._id;

    if (!review) {
      return next(new ErrorResponse(`No review with id ${reviewId}`, 404));
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && loggedUser._id !== review.author) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to update review ${review._id}`,
          401
        )
      );
    }

    const result = await execUpdateReview(review, req.body);

    res.status(200).json({ success: true, data: result });
  }
);

// @desc  Delete review
// @route DELETE /api/v1/reviews/:id
// @access Private
export const deleteReview = asyncHandler(
  async (req: Request<{ id: string }>, res: Response, next) => {
    const reviewId = new ObjectId(req.params.id);
    let review = await Reviews.findOne({ _id: reviewId });

    if (!review) {
      return next(new ErrorResponse(`No review with id ${reviewId}`, 404));
    }

    const loggedUser = checkLoggedUser(req);
    if (loggedUser.role !== 'admin' && loggedUser._id !== review.author) {
      return next(
        new ErrorResponse(
          `User ${loggedUser._id} is not authorized to delete review ${review._id}`,
          401
        )
      );
    }

    await execDeleteReview(review);

    res.status(204).send();
  }
);
