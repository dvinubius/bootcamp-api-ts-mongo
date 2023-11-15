import { Request, Response, NextFunction } from 'express';
import { ObjectId, WithId } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ResponseCT } from '../types/response-custom-type.type.js';
import { User, UserCreateDto, UserUpdateDto, Users } from './user-model.js';
import { execDeleteUser } from './user-service.js';
import {
  execRegisterUser,
  execUpdateUserDetails,
} from '../auth/auth-service.js';

// @desc  Get all users
// @route GET /api/v1/users
// @access Private/Admin
export const getUsers = asyncHandler(
  async (
    req: Request,
    res: ResponseCT<{ data: User[] }>,
    next: NextFunction
  ) => {
    res.status(200).json(res.advancedResults);
  }
);

// @desc  Get a single user
// @route GET /api/v1/users/:id
// @access Private/Admin
export const getUser = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: ResponseCT<{ data: User }>,
    next: NextFunction
  ) => {
    const userId = new ObjectId(req.params.id);
    const user = await Users.findOne(userId);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc  Create a user
// @route POST /api/v1/users/
// @access Private/Admin
export const createUser = asyncHandler(
  async (
    req: Request<{}, {}, UserCreateDto>,
    res: ResponseCT<{ data: WithId<User> }>,
    next: NextFunction
  ) => {
    const user = await execRegisterUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  }
);

// @desc  Update a user
// @route PUT /api/v1/users/:id
// @access Private/Admin
export const updateUser = asyncHandler(
  async (
    req: Request<{ id: string }, {}, UserUpdateDto>,
    res: ResponseCT<{ data: WithId<User> }>,
    next: NextFunction
  ) => {
    const userId = new ObjectId(req.params.id);
    let user = await Users.findOne(userId);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${userId}`, 404)
      );
    }

    const result = await execUpdateUserDetails(user, req.body);
    res.status(200).json({ success: true, data: result! });
  }
);

// @desc Delete a user
// @route DELETE /api/v1/users/:id
// @access Private/Admin
export const deleteUser = asyncHandler(
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const userId = new ObjectId(req.params.id);
    const user = await Users.findOne(userId);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${userId}`, 404)
      );
    }
    await execDeleteUser(user);

    res.status(204).send();
  }
);
