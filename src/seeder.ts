import fs from 'fs';
import 'colors';
import './config/load.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as z from 'zod';

import { ObjectId, OptionalId, WithId } from 'mongodb';
import {
  Bootcamp,
  BootcampCreateDto,
  Bootcamps,
} from './bootcamp/bootcamp-model.js';
import { CourseCreateDto, Courses } from './course/course-model.js';
import { User, UserCreateDto, Users } from './user/user-model.js';
import { Review, ReviewCreateDto, Reviews } from './review/review-model.js';
import { createIndexes, deleteIndexes } from './utils/check-db-indexes.js';
import { execCreateBootcamp } from './bootcamp/bootcamp-service.js';
import { execCreateCourse } from './course/course-service.js';
import { execRegisterUser } from './auth/auth-service.js';
import { execCreateReview } from './review/review-service.js';

// SEED DATA Validators
const objectIdValidator = z.string().refine((val) => ObjectId.isValid(val));

const UserDtoAdditional = z.object({
  _id: objectIdValidator,
});
type UserDtoAdditional = z.infer<typeof UserDtoAdditional>;

const BootcampDtoAdditional = z.object({
  _id: objectIdValidator,
  owner: objectIdValidator,
});
type BootcampDtoAddtional = z.infer<typeof BootcampDtoAdditional>;

const CourseDtoAdditional = z.object({
  _id: objectIdValidator,
  owner: objectIdValidator,
  bootcamp: objectIdValidator,
});
type CourseDtoAdditional = z.infer<typeof CourseDtoAdditional>;

const ReviewDtoAdditional = z.object({
  _id: objectIdValidator,
  bootcamp: objectIdValidator,
  author: objectIdValidator,
});
type ReviewDtoAdditional = z.infer<typeof ReviewDtoAdditional>;

// Read JSON files
const users: OptionalId<WithId<UserCreateDto & UserDtoAdditional>>[] =
  JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'));
const bootcamps: OptionalId<
  WithId<BootcampCreateDto & BootcampDtoAddtional>
>[] = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'));
const courses: OptionalId<WithId<CourseCreateDto & CourseDtoAdditional>>[] =
  JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'));
const reviews: OptionalId<WithId<Review & ReviewDtoAdditional>>[] = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await createIndexes();
    // USERS
    for (const user of users) {
      await UserCreateDto.parseAsync(user);
      const withId = {
        ...user,
        _id: new ObjectId(user._id),
      };
      await execRegisterUser(withId);
    }
    // BOOTCAMPS
    for (const bootcamp of bootcamps) {
      await BootcampCreateDto.parseAsync(bootcamp);
      await BootcampDtoAdditional.parseAsync(bootcamp);
      const loggedUser = {
        _id: new ObjectId(bootcamp.owner),
      } as WithId<User>;
      const withId = {
        ...bootcamp,
        _id: new ObjectId(bootcamp._id),
      };
      await execCreateBootcamp(withId, loggedUser);
    }
    // COURSES
    for (const course of courses) {
      await CourseCreateDto.parseAsync(course);
      await CourseDtoAdditional.parseAsync(course);
      const bootcamp = bootcamps.find((b) => b._id === course.bootcamp);
      const loggedUser = {
        _id: new ObjectId(course.owner),
      } as WithId<User>;
      const withId = {
        ...course,
        _id: new ObjectId(course._id),
      };
      await execCreateCourse(
        withId,
        bootcamp as unknown as WithId<Bootcamp>,
        loggedUser
      );
    }
    // REVIEWS
    for (const review of reviews) {
      await ReviewCreateDto.parseAsync(review);
      await ReviewDtoAdditional.parseAsync(review);
      const bootcamp = bootcamps.find((b) => b._id === review.bootcamp);
      const loggedUser = {
        _id: new ObjectId(review.author),
      } as unknown as WithId<User>;
      const withId = {
        ...review,
        _id: new ObjectId(review._id),
      };
      await execCreateReview(
        withId,
        bootcamp as unknown as WithId<Bootcamp>,
        loggedUser
      );
    }

    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
    await deleteData();
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Bootcamps.deleteMany();
    await Courses.deleteMany();
    await Users.deleteMany();
    await Reviews.deleteMany();
    await deleteIndexes();
    console.log('Data Destroyed...'.red.inverse);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  process.exit();
}
