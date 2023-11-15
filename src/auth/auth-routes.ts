import express from 'express';

import {
  forgotPassword,
  resetPassword,
  getMe,
  login,
  register,
  updateUserDetails,
  updatePassword,
  logout,
} from './auth-controller.js';
import { protect } from './auth-middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { UserCreateDto, UserUpdateDto } from '../user/user-model.js';
import { UpdatePasswordDto } from './types/update-password.dto.js';
import { ForgotPasswordDto } from './types/forgot-password.dto.js';
import { ResetPasswordDto } from './types/reset-password.dto.js';

const router = express.Router();

router.post('/register', validateRequest({ body: UserCreateDto }), register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put(
  '/updatedetails',
  protect,
  validateRequest({ body: UserUpdateDto }),
  updateUserDetails
);
router.put(
  '/updatepassword',
  protect,
  validateRequest({ body: UpdatePasswordDto }),
  updatePassword
);
router.post(
  '/forgotpassword',
  validateRequest({ body: ForgotPasswordDto }),
  forgotPassword
);
router.put(
  '/resetpassword/:resettoken',
  validateRequest({ body: ResetPasswordDto }),
  resetPassword
);

export default router;
