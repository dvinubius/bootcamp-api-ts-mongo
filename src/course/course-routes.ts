import express from 'express';
import {
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
} from './course-controller.js';
import {
  COURSE_DEFAULT_POPULATE,
  Course,
  CourseUpdateDto,
  Courses,
} from './course-model.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect, authorize } from '../auth/auth-middleware.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = express.Router({ mergeParams: true });

router.route('/').get(
  // TODO validate request query
  advancedResults<Course>(Courses, COURSE_DEFAULT_POPULATE),
  getCourses
);

router
  .route('/:id')
  .get(getCourse)
  .put(
    protect,
    authorize('publisher', 'admin'),
    validateRequest({ body: CourseUpdateDto }),
    updateCourse
  )
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

export default router;
