import { COURSE_OWNER_FIELDS } from '../course-model.js';

export const populateCourseAggStages = [
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner',
    },
  },
  {
    $unwind: '$owner',
  },
  {
    $project: {
      course: '$$ROOT',
      owner: COURSE_OWNER_FIELDS.reduce((acc, field) => {
        Object.assign(acc, { [field]: '$owner.' + field });
        return acc;
      }, {}),
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: ['$course', { owner: '$owner' }],
      },
    },
  },
];
