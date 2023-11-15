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
} from '../course/course-model.js';
import {
  REVIEW_DEFAULT_POPULATE,
  Review,
  Reviews,
} from '../review/review-model.js';
import { BC_DEFAULT_POPULATE, Bootcamp, Bootcamps } from './bootcamp-model.js';
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

const router = express.Router();

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

// prettier-ignore
router.route('/')
  .get(advancedResults<Bootcamp>(
    Bootcamps,
    BC_DEFAULT_POPULATE
  ), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp);

// prettier-ignore
router.route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

// prettier-ignore
router.route('/:id/courses')
    .get(advancedResults<Course>(
      Courses, 
      COURSE_DEFAULT_POPULATE
    ), getCoursesForBootcamp)
    .post(protect, authorize('publisher', 'admin'), addCourse);

// prettier-ignore
router
  .route('/:id/reviews')
  .get(advancedResults<Review>(
    Reviews, 
    REVIEW_DEFAULT_POPULATE
  ), getReviewsForBootcamp)
  .post(protect, authorize('user', 'admin'), addReview);

router
  .route('/:id/register')
  .post(protect, authorize('admin'), registerForBootcamp);

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

export default router;
