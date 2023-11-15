import { ObjectId, WithId } from 'mongodb';
import _ from 'lodash';

import {
  REVIEW_BOOTCAMP_FIELDS,
  Review,
  ReviewCreateDto,
  ReviewPopulated,
  ReviewUpdateDto,
  Reviews,
} from './review-model.js';
import { Bootcamp, Bootcamps } from '../bootcamp/bootcamp-model.js';
import { User } from '../user/user-model.js';
import { populateReviewAggStages } from './aggregation/review-populate-stages.js';

export const getPopulatedReviews = async (
  matchCondition: Object
): Promise<WithId<ReviewPopulated>[]> => {
  const cursor = Reviews.aggregate([
    {
      $match: matchCondition,
    },
    ...populateReviewAggStages,
  ]);
  const results = (await cursor.toArray()) as WithId<ReviewPopulated>[];
  return results;
};

export const execCreateReview = async (
  dto: ReviewCreateDto,
  bootcamp: WithId<Bootcamp>,
  loggedUser: WithId<User>
) => {
  const reviewData: Review = {
    ...dto,
    author: loggedUser._id,
    bootcamp: _.pick(bootcamp, ['_id', ...REVIEW_BOOTCAMP_FIELDS]),
  };
  const result = await Reviews.insertOne(reviewData);
  const reviewId = result.insertedId;
  await updateAverageRating(bootcamp._id);

  const [populated] = await getPopulatedReviews({ _id: reviewId });
  return populated;
};

export const execUpdateReview = async (
  review: WithId<Review>,
  dto: ReviewUpdateDto
) => {
  await Reviews.findOneAndUpdate({ _id: review._id }, { $set: dto });
  if (dto.rating) {
    await updateAverageRating(review.bootcamp._id);
  }
  const [populated] = await getPopulatedReviews({ _id: review._id });
  return populated;
};

export const execDeleteReview = async (review: WithId<Review>) => {
  await Reviews.deleteOne({ _id: review._id });
  await updateAverageRating(review.bootcamp._id);
};

export const updateAverageRating = async (bootcampId: ObjectId) => {
  const pipeline = [
    // step 1
    {
      $match: { bootcamp: bootcampId },
    },
    // step 2
    {
      $group: {
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ];

  const aggCursor = Reviews.aggregate(pipeline);
  const [result] = await aggCursor.toArray();

  try {
    if (result) {
      await Bootcamps.updateOne(
        { _id: bootcampId },
        {
          $set: { averageRating: result.averageRating },
        }
      );
    } else {
      await Bootcamps.updateOne(
        { _id: bootcampId },
        {
          $unset: { averageRating: '' },
        }
      );
    }
  } catch (e) {
    console.error(e);
  }
};
