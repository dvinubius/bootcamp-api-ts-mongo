import * as z from 'zod';
import { ObjectId, WithId } from 'mongodb';

import { db } from '../config/db.js';

import { CAREERS } from './types/career.enum.type.js';
import { Location } from './types/location.type.js';
import { UserCreateDto } from '../user/user-model.js';
import { Course } from '../course/course-model.js';
import { PopulateArg } from '../middleware/advanced-results.js';

export const BootcampCreateDto = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  website: z.string().url(),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
  address: z.string().min(10),
  careers: z.array(z.enum(CAREERS)),
  photo: z.string().url(),
  housing: z.boolean(),
  jobAssistance: z.boolean(),
  jobGuarantee: z.boolean(),
  acceptGi: z.boolean(),
});
export const BootcampUpdateDto = BootcampCreateDto.partial();

export type BootcampCreateDto = z.infer<typeof BootcampCreateDto>;
export type BootcampUpdateDto = Partial<BootcampCreateDto>;

// restricting possibly populated fields
export const BOOTCAMP_OWNER_FIELDS = ['name', 'email'] as const;
export const BOOTCAMP_COURSES_FIELDS = ['title', 'description'] as const;
export const BOOTCAMP_PARTICIPANTS_FIELDS = ['name', 'email'] as const;

// keep subdoc fields flexible to serve multiple use cases
export type OwnerSubDoc = WithId<
  Partial<Pick<UserCreateDto, (typeof BOOTCAMP_OWNER_FIELDS)[number]>>
>;
export type CourseSubDoc = WithId<
  Partial<Pick<Course, (typeof BOOTCAMP_COURSES_FIELDS)[number]>>
>;
export type ParticipantSubDoc = WithId<
  Partial<Pick<UserCreateDto, (typeof BOOTCAMP_PARTICIPANTS_FIELDS)[number]>>
>;

export type Bootcamp = BootcampCreateDto & {
  slug: string;
  location: Location;
  averageRating: number;
  averageCost: number;
  owner: ObjectId;
  courses: ObjectId[];
  participants: ObjectId[];
};

export type BootcampPopulated = Bootcamp & {
  owner: OwnerSubDoc;
  courses: CourseSubDoc[];
  participants: ParticipantSubDoc[];
};

export const Bootcamps = db.collection<Bootcamp>('bootcamps');

// advancedSearch middleware config
export const BOOTCAMP_DEFAULT_POPULATE: PopulateArg[] = [
  { path: 'courses', collection: 'courses', select: BOOTCAMP_COURSES_FIELDS },
  { path: 'owner', collection: 'users', select: BOOTCAMP_OWNER_FIELDS },
  {
    path: 'participants',
    collection: 'users',
    select: BOOTCAMP_PARTICIPANTS_FIELDS,
  },
];
