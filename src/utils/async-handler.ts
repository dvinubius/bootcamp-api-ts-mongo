import { NextFunction, Request } from 'express';

import { ResponseCT } from '../types/response-custom-type.type.js';

export function asyncHandler<A = any, B = any, C = any, D = any>(
  fn: (
    req: Request<A, B, C>,
    res: ResponseCT<D>,
    next: NextFunction
  ) => Promise<void>
) {
  return (req: Request<A, B, C>, res: ResponseCT<D>, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}
