import { Request } from 'express';
import { WithId } from 'mongodb';
import { User } from '../user/user-model.js';

export const checkLoggedUser = (req: Request): WithId<User> => {
  if (!req.user) {
    throw new Error(
      'Internal: Expected user not set on request by auth middleware. Check the route configuration'
    );
  }
  return req.user;
};
