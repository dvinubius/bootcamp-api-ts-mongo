import { NextFunction, Request, Response } from 'express';
import { WithId } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ResponseCT } from '../types/response-custom-type.type.js';
import { checkLoggedUser } from '../utils/check-user-set.js';
import {
  User,
  UserCreateDto,
  UserUpdateDto,
  Users,
} from '../user/user-model.js';
import { TokenResponse } from './types/token-response.type.js';
import { Credentials } from './types/credentials.type.js';
import {
  execForgotPassword,
  execRegisterUser,
  execUpdatePassword,
  execUpdateUserDetails,
  findUserForPasswordReset,
  getLoginCookieOptions,
  getLogoutCookieOptions,
  getSignedJwt,
  matchUserEnteredPwd,
} from './auth-service.js';
import { UpdatePasswordDto } from './types/update-password.dto.js';
import { ForgotPasswordDto } from './types/forgot-password.dto.js';
import { ResetPasswordDto } from './types/reset-password.dto.js';

// @desc  Register a user
// @route POST /api/v1/auth/register
// @access Public
export const register = asyncHandler(
  async (
    req: Request<{}, {}, UserCreateDto>,
    res: ResponseCT<TokenResponse>,
    next: NextFunction
  ) => {
    const user = await execRegisterUser(req.body);

    sendTokenResponse(user, 200, res);
  }
);

// @desc  Login a user
// @route POST /api/v1/auth/login
// @access Public
export const login = asyncHandler(
  async (
    req: Request<{}, {}, Credentials>,
    res: ResponseCT<TokenResponse>,
    next: NextFunction
  ) => {
    const { email, password } = req.body;

    // validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // check for user
    const user = await Users.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const pwdOk = await matchUserEnteredPwd(user, password);
    if (!pwdOk) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
  }
);

// @desc  Get logged in user
// @route GET /api/v1/auth/me
// @access Private
export const getMe = asyncHandler(
  async (
    req: Request,
    res: ResponseCT<{ data: WithId<User> }>,
    next: NextFunction
  ) => {
    const loggedUser = checkLoggedUser(req);
    res.status(200).json({
      success: true,
      data: loggedUser,
    });
  }
);

// @desc  Logout
// @route GET /api/v1/auth/logout
// @access Private
export const logout = asyncHandler(
  async (req: Request, res: ResponseCT, next: NextFunction) => {
    const options = getLogoutCookieOptions();

    // prettier-ignore
    res
      .status(200)
      .cookie('token', 'none', options)
      .json({ success: true });
  }
);

// @desc  Update user details
// @route PUT /api/v1/auth/updatedetails
// @access Private
export const updateUserDetails = asyncHandler(
  async (
    req: Request<{}, {}, UserUpdateDto>,
    res: ResponseCT<{ data: WithId<User> }>,
    next: NextFunction
  ) => {
    const loggedUser = checkLoggedUser(req);
    const result = await execUpdateUserDetails(loggedUser, req.body);

    res.status(200).json({
      success: true,
      data: result!,
    });
  }
);

// @desc  Update user details
// @route PUT /api/v1/auth/updatepassword
// @access Private
export const updatePassword = asyncHandler(
  async (
    req: Request<{}, {}, UpdatePasswordDto>,
    res: ResponseCT<TokenResponse>,
    next: NextFunction
  ) => {
    const loggedUser = checkLoggedUser(req);
    const user = await Users.findOne({ _id: loggedUser._id });

    if (!user) {
      throw Error('User not found by the id obtained from auth middleware');
    }

    if (!(await matchUserEnteredPwd(user, req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }

    const result = await execUpdatePassword(user, req.body.newPassword);

    sendTokenResponse(user, 200, res);
  }
);

// @desc  Forgot Password
// @route POST /api/v1/auth/forgotpassword
// @access Public
export const forgotPassword = asyncHandler(
  async (
    req: Request<{}, {}, ForgotPasswordDto>,
    res: Response,
    next: NextFunction
  ) => {
    const user = await Users.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('There is no user with this email', 400));
    }

    const emailSuccess = await execForgotPassword(user, req);

    if (emailSuccess) {
      res.status(200).json({ success: true, data: 'Email sent' });
    } else {
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  }
);

// @desc  Reset Password
// @route PUT /api/v1/auth/resetpassword/:resettoken
// @access Public
export const resetPassword = asyncHandler(
  async (
    req: Request<{ resettoken: string }, {}, ResetPasswordDto>,
    res: ResponseCT<TokenResponse>,
    next: NextFunction
  ) => {
    const user = await findUserForPasswordReset(req.params.resettoken);

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }

    await execUpdatePassword(user, req.body.password, true);

    sendTokenResponse(user, 200, res);
  }
);

export const sendTokenResponse = (
  user: WithId<User>,
  statusCode: number,
  res: ResponseCT<TokenResponse>
) => {
  const token = getSignedJwt(user);
  const options = getLoginCookieOptions();

  // prettier-ignore
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    })
};
