import express from 'express';

import {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
  registerForBootcamp,
} from './bootcamp-controller.js';
import {
  Course,
  Courses,
  COURSE_DEFAULT_POPULATE,
  CourseCreateDto,
} from '../course/course-model.js';
import {
  REVIEW_DEFAULT_POPULATE,
  Review,
  ReviewCreateDto,
  Reviews,
} from '../review/review-model.js';
import {
  BOOTCAMP_DEFAULT_POPULATE,
  Bootcamp,
  BootcampCreateDto,
  Bootcamps,
} from './bootcamp-model.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect, authorize } from '../auth/auth-middleware.js';
import {
  addCourse,
  getCoursesForBootcamp,
} from '../course/course-controller.js';
import {
  addReview,
  getReviewsForBootcamp,
} from '../review/review-controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import { BootcampUpdateDto } from './bootcamp-model.js';
import { RegisterForBootcampDto } from './types/register-for-bootcamp.dto.js';

const router = express.Router();

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/')
  .get(
    // TODO validate request query
    advancedResults<Bootcamp>(Bootcamps, BOOTCAMP_DEFAULT_POPULATE),
    getBootcamps
  )
  .post(
    protect,
    authorize('publisher', 'admin'),
    validateRequest({ body: BootcampCreateDto }),
    createBootcamp
  );

router
  .route('/:id')
  .get(getBootcamp)
  .put(
    protect,
    authorize('publisher', 'admin'),
    validateRequest({ body: BootcampUpdateDto }),
    updateBootcamp
  )
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router
  .route('/:id/courses')
  .get(
    // TODO validate request query
    advancedResults<Course>(Courses, COURSE_DEFAULT_POPULATE),
    getCoursesForBootcamp
  )
  .post(
    protect,
    authorize('publisher', 'admin'),
    validateRequest({ body: CourseCreateDto }),
    addCourse
  );

router
  .route('/:id/reviews')
  .get(
    // TODO validate request query
    advancedResults<Review>(Reviews, REVIEW_DEFAULT_POPULATE),
    getReviewsForBootcamp
  )
  .post(
    protect,
    authorize('user', 'admin'),
    validateRequest({ body: ReviewCreateDto }),
    addReview
  );

router
  .route('/:id/register')
  .post(
    protect,
    authorize('admin'),
    validateRequest({ body: RegisterForBootcampDto }),
    registerForBootcamp
  );

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

export default router;
