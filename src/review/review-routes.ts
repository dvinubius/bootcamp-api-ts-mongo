import express from 'express';

import { REVIEW_DEFAULT_POPULATE, Review, Reviews } from './review-model.js';
import {
  getReviews,
  getReview,
  updateReview,
  deleteReview,
} from './review-controller.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect } from '../auth/auth-middleware.js';

const router = express.Router({ mergeParams: true });

// prettier-ignore
router.route('/').get(
  advancedResults<Review>(
    Reviews, 
    REVIEW_DEFAULT_POPULATE
  ),
  getReviews
);

// prettier-ignore
router.route('/:id')
  .get(getReview)
  .put(protect, updateReview)
  .delete(protect, deleteReview)

export default router;
