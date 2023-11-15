import { NextFunction, Request, Response } from 'express';
import { MongoError } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { ZodError } from 'zod';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response<Omit<ErrorResponse, 'statusCode'>>,
  next: NextFunction
) => {
  // if it's not our custom error, attempt to narrow it down
  const errorRes = err instanceof ErrorResponse ? err : narrowDownError(err);

  const statusCode = errorRes.statusCode;
  const resp = {
    ...errorRes,
    statusCode: undefined,
  };
  res.status(statusCode).json(resp);
};

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

const narrowDownError = (err: Error) => {
  let errorRes = new ErrorResponse(err.message || 'Server Error', 500);

  // for dev
  console.log(err.stack?.red);
  if (err instanceof ZodError) {
    errorRes = new ErrorResponse(err.message, 400);
  }
  if (
    err instanceof MongoError &&
    err.name === 'MongoServerError' &&
    err.code === MONGO_DUPLICATE_KEY_ERROR_CODE
  ) {
    const message = 'Duplicate field value entered';
    errorRes = new ErrorResponse(message, 400);
  }
  return errorRes;
};

export default errorHandler;
