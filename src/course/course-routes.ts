import express from 'express';
import {
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
} from './course-controller.js';
import { COURSE_DEFAULT_POPULATE, Course, Courses } from './course-model.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect, authorize } from '../auth/auth-middleware.js';

const router = express.Router({ mergeParams: true });

// prettier-ignore
router.route('/')
  .get(advancedResults<Course>(
    Courses, 
    COURSE_DEFAULT_POPULATE
  ), getCourses);

// prettier-ignore
router.route('/:id')
  .get(getCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

export default router;
