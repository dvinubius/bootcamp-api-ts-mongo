import {
  BOOTCAMP_COURSES_FIELDS,
  BOOTCAMP_OWNER_FIELDS,
  BOOTCAMP_PARTICIPANTS_FIELDS,
} from '../bootcamp-model.js';

export const populateBootcampAggStages = [
  // OWNER
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
      bootcamp: '$$ROOT',
      owner: BOOTCAMP_OWNER_FIELDS.reduce((acc, field) => {
        Object.assign(acc, { [field]: '$owner.' + field });
        return acc;
      }, {}),
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: ['$bootcamp', { owner: '$owner' }],
      },
    },
  },
  // PARTICIPANTS
  {
    $lookup: {
      from: 'users',
      localField: 'participants',
      foreignField: '_id',
      as: 'participants',
    },
  },
  {
    $unwind: '$participants',
  },
  {
    $group: {
      _id: '$_id',
      bootcamp: { $first: '$$ROOT' },
      participants: {
        $push: BOOTCAMP_PARTICIPANTS_FIELDS.reduce((acc, field) => {
          Object.assign(acc, { [field]: '$participants.' + field });
          return acc;
        }, {}),
      },
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: ['$bootcamp', { participants: '$participants' }],
      },
    },
  },
  // COURSES
  {
    $lookup: {
      from: 'courses',
      localField: 'courses',
      foreignField: '_id',
      as: 'courses',
    },
  },
  {
    $unwind: '$courses',
  },
  {
    $group: {
      _id: '$_id',
      bootcamp: { $first: '$$ROOT' },
      courses: {
        $push: BOOTCAMP_COURSES_FIELDS.reduce((acc, field) => {
          Object.assign(acc, { [field]: '$courses.' + field });
          return acc;
        }, {}),
      },
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: ['$bootcamp', { courses: '$courses' }],
      },
    },
  },
];
