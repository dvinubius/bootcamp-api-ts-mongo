import { REVIEW_AUTHOR_FIELDS } from '../review-model.js';

export const populateReviewAggStages = [
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'author',
    },
  },
  {
    $unwind: '$author',
  },
  {
    $project: {
      review: '$$ROOT',
      author: REVIEW_AUTHOR_FIELDS.reduce((acc, field) => {
        Object.assign(acc, { [field]: '$author.' + field });
        return acc;
      }, {}),
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: ['$review', { author: '$author' }],
      },
    },
  },
];
