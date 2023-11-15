import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { asyncHandler } from '../utils/async-handler.js';
import { ErrorResponse } from '../utils/error-response.js';
import { User, Users } from '../user/user-model.js';
import { checkLoggedUser } from '../utils/check-user-set.js';
import { Role } from '../user/types/role.enum.type.js';
import { ObjectId } from 'mongodb';

const jwtSecret = process.env.JWT_SECRET;

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // SET FROM COOKIE - not needed atm
    // else if (req.cookies.token) {
    //   token = req.cookies.token
    // }

    if (!token) {
      return next(new ErrorResponse('Not authorized', 401));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret!) as jwt.JwtPayload;
      if (!decoded.id) {
        return next(new ErrorResponse('Jwt verification failed', 500));
      }
      const user = await Users.findOne({ _id: new ObjectId(decoded.id) });
      if (!user) {
        return next(
          new ErrorResponse('Jwt-decoded userId matches no user in DB', 500)
        );
      }
      req.user = user;
      next();
    } catch (err) {
      return next(new ErrorResponse('Not authorized', 401));
    }
  }
);

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const loggedUser = checkLoggedUser(req);

    if (!roles.includes(loggedUser.role)) {
      return next(
        new ErrorResponse(
          `User role ${loggedUser.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
