import express from 'express';

import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from './user-controller.js';
// Include other resource routers
import { User, UserCreateDto, UserUpdateDto, Users } from './user-model.js';
import advancedResults from '../middleware/advanced-results.js';
import { protect, authorize } from '../auth/auth-middleware.js';
import { validateRequest } from '../middleware/validate-request.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(advancedResults<User>(Users), getUsers)
  .post(validateRequest({ body: UserCreateDto }), createUser);

router
  .route('/:id')
  .get(getUser)
  .put(validateRequest({ body: UserUpdateDto }), updateUser)
  .delete(deleteUser);

export default router;
