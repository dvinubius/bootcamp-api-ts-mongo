import * as z from 'zod';
import { db } from '../config/db.js';
import { ObjectId, WithId } from 'mongodb';

import { MINIMUM_SKILLS } from './types/minimum-skill.enum.type.js';
import { Bootcamp } from '../bootcamp/bootcamp-model.js';
import { User } from '../user/user-model.js';
import { PopulateArg } from '../middleware/advanced-results.js';

export const CourseCreateDto = z.object({
  title: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  weeks: z.number().min(1).max(16),
  tuition: z.number().min(0),
  minimumSkill: z.enum(MINIMUM_SKILLS),
  scholarshipAvailable: z.boolean(),
});
export const CourseUpdateDto = CourseCreateDto.partial();

export type CourseCreateDto = z.infer<typeof CourseCreateDto>;
export type CourseUpdateDto = Partial<CourseCreateDto>;

// restricting possibly populated fields
export const COURSE_BOOTCAMP_FIELDS = ['name', 'slug'] as const;
export const COURSE_OWNER_FIELDS = ['name', 'email'] as const;

// subdocs kept flexible as partials, but guaranteed with IDs
export type BootcampSubDoc = WithId<
  Partial<Pick<Bootcamp, (typeof COURSE_BOOTCAMP_FIELDS)[number]>>
>;
export type OwnerSubDoc = WithId<
  Partial<Pick<User, (typeof COURSE_OWNER_FIELDS)[number]>>
>;

export type Course = CourseCreateDto & {
  bootcamp: BootcampSubDoc;
  owner: ObjectId;
};

export type CoursePopulated = Course & {
  owner: OwnerSubDoc;
};

export const Courses = db.collection<Course>('courses');

// advancedSearch middleware config
export const COURSE_DEFAULT_POPULATE: PopulateArg[] = [
  { path: 'owner', collection: 'users', select: COURSE_OWNER_FIELDS },
];
