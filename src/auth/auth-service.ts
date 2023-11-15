import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { WithId } from 'mongodb';

import {
  User,
  UserCreateDto,
  UserUpdateDto,
  Users,
} from '../user/user-model.js';
import sendEmail from '../utils/send-email.js';

export const execRegisterUser = async (dto: UserCreateDto) => {
  const password = await hashedPassword(dto.password);
  const userData = {
    ...dto,
    password,
    bootcampsJoined: [],
  };

  const result = await Users.insertOne(userData);
  return {
    ...userData,
    _id: result.insertedId,
  };
};

export const execUpdateUserDetails = async (
  user: WithId<User>,
  dto: UserUpdateDto
) => {
  return await Users.findOneAndUpdate({ _id: user._id }, { $set: dto });
};

export const execUpdatePassword = async (
  user: WithId<User>,
  newPassword: string,
  onReset = false
) => {
  const password = await hashedPassword(newPassword);
  const tokensUpdate = onReset
    ? {
        $unset: {
          resetPasswordToken: 1 as 1,
          resetPasswordExpire: 1 as 1,
        },
      }
    : {};
  const update = {
    password,
    ...tokensUpdate,
  };

  await Users.findOneAndUpdate({ _id: user._id }, { $set: update });
};

export const execForgotPassword = async (
  user: WithId<User>,
  req: Request
): Promise<boolean> => {
  const { resetToken, resetPasswordToken, resetPasswordExpire } =
    getResetPasswordData();

  const userUpdate: Partial<User> = {
    resetPasswordToken,
    resetPasswordExpire,
  };

  await Users.updateOne({ _id: user._id }, { $set: userUpdate });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    });
    return true;
  } catch (err) {
    console.log(err);
    await Users.updateOne(
      { _id: user._id },
      {
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpire: 1,
        },
      }
    );
    return false;
  }
};

export const getLoginCookieOptions = () => {
  const cookieExpire = process.env.JWT_COOKIE_EXPIRE;
  return {
    expires: new Date(
      Date.now() + Number.parseInt(cookieExpire!) * 24 * 3600 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
};

export const getLogoutCookieOptions = () => {
  return {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };
};

export const getSignedJwt = (user: WithId<User>) => {
  const jwtSecret = process.env.JWT_SECRET;
  return jwt.sign({ id: user._id }, jwtSecret!, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const matchUserEnteredPwd = async (
  user: User,
  userEnteredPwd: string
) => {
  return await bcrypt.compare(userEnteredPwd, user.password);
};

export const findUserForPasswordReset = async (resettoken: string) => {
  // get hashed token
  const resetPasswordToken = hashedToken(resettoken);
  return Users.findOne({
    resetPasswordToken,
    resetPassowdExpire: { $gt: Date.now() },
  });
};

// ------------- INTERNAL -------------

const hashedPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const hashedToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const getResetPasswordData = () => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetPasswordToken = hashedToken(resetToken);
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  return { resetToken, resetPasswordToken, resetPasswordExpire };
};
