import { ObjectId, WithId } from 'mongodb';
import _ from 'lodash';

import {
  COURSE_BOOTCAMP_FIELDS,
  Course,
  CourseCreateDto,
  CoursePopulated,
  CourseUpdateDto,
  Courses,
} from './course-model.js';
import { User } from '../user/user-model.js';
import { Bootcamp, Bootcamps } from '../bootcamp/bootcamp-model.js';
import { populateCourseAggStages } from './aggregation/course-populate-stages.js';

export const getPopulatedCourses = async (
  matchCondition: Object
): Promise<WithId<CoursePopulated>[]> => {
  const cursor = Courses.aggregate([
    {
      $match: matchCondition,
    },
    ...populateCourseAggStages,
  ]);
  const results = (await cursor.toArray()) as WithId<CoursePopulated>[];
  return results;
};

export const execCreateCourse = async (
  dto: CourseCreateDto,
  bootcamp: WithId<Bootcamp>,
  loggedUser: WithId<User>
) => {
  const courseData = {
    ...dto,
    bootcamp: _.pick(bootcamp, ['_id', ...COURSE_BOOTCAMP_FIELDS]),
    owner: loggedUser._id,
  };
  const result = await Courses.insertOne(courseData);
  const courseId = result.insertedId;

  // for the parent bootcamp: course ref + avg cost
  await updateParentBootcamp(courseId, bootcamp._id);

  const [populated] = await getPopulatedCourses({ _id: courseId });
  return populated;
};

export const execUpdateCourse = async (
  course: WithId<Course>,
  dto: CourseUpdateDto
) => {
  await Courses.updateOne({ _id: course._id }, { $set: dto });

  if (dto.tuition) {
    const avgCostUpdate = await getAverageCostUpdate(course.bootcamp._id);
    await Bootcamps.updateOne(
      { _id: course.bootcamp._id },
      { $set: avgCostUpdate }
    );
  }

  const [populated] = await getPopulatedCourses({ _id: course._id });
  return populated;
};

export const execDeleteCourse = async (course: WithId<Course>) => {
  await Courses.deleteOne({ _id: course._id });
  await cleanupAfterDelete(course._id, course.bootcamp._id);
};

// --------------- INTERNAL ----------------

const updateParentBootcamp = async (
  courseId: ObjectId,
  bootcampId: ObjectId
) => {
  const avgCostUpdate = await getAverageCostUpdate(bootcampId);

  await Bootcamps.updateOne(
    { _id: bootcampId },
    {
      $push: { courses: courseId },
      $set: avgCostUpdate,
    }
  );
};

const cleanupAfterDelete = async (courseId: ObjectId, bootcampId: ObjectId) => {
  const avgCostUpdate = await getAverageCostUpdate(bootcampId);

  await Bootcamps.updateOne(
    { _id: bootcampId },
    {
      $pull: { courses: courseId },
      $set: avgCostUpdate,
    }
  );
};

const getAverageCostUpdate = async (bootcampId: ObjectId) => {
  const pipeline = [
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ];
  const cursor = Courses.aggregate(pipeline);
  const agg = await cursor.toArray();
  const avgCost = agg[0]?.averageCost ?? 0;
  return { averageCost: Math.ceil(avgCost / 10) * 10 };
};
