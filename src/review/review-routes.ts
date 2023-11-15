import express from 'express';

import {
  REVIEW_DEFAULT_POPULATE,
  Review,
  ReviewUpdateDto,
  Reviews,
} from './review-model.js';
import {
  getReviews,
  getReview,
  updateReview,
  deleteReview,
} from './review-controller.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect } from '../auth/auth-middleware.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = express.Router({ mergeParams: true });

router.route('/').get(
  // TODO validate request query
  advancedResults<Review>(Reviews, REVIEW_DEFAULT_POPULATE),
  getReviews
);

router
  .route('/:id')
  .get(getReview)
  .put(protect, validateRequest({ body: ReviewUpdateDto }), updateReview)
  .delete(protect, deleteReview);

export default router;
