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

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateUserDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;
