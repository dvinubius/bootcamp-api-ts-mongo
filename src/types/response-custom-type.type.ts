import { Response } from 'express';

import { AdvancedResults } from '../middleware/advanced-results.js';

type Extension = {
  success: boolean;
};

// ResponseCT = Response as Custom Type
// advancedResults is added to response body by advancedResults middleware
export type ResponseCT<
  ResBody = Extension,
  Locals extends Record<string, any> = Record<string, any>
> = Response<ResBody & Extension, Locals> & {
  advancedResults?: AdvancedResults;
};
