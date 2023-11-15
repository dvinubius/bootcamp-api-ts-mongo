import { Request, NextFunction } from 'express';
import { Collection } from 'mongodb';

import { ErrorResponse } from '../utils/error-response.js';
import { ResponseCT } from '../types/response-custom-type.type.js';

import { Bootcamp } from '../bootcamp/bootcamp-model.js';
import { Course } from '../course/course-model.js';
import { Review } from '../review/review-model.js';
import { User } from '../user/user-model.js';

export type AdvancedResults = {
  success: boolean;
  count: number;
  data: any[];
  pagination: {
    next?: {
      page: number;
      limit: number;
    };
    prev?: {
      page: number;
      limit: number;
    };
  };
};

export type PopulateArg = {
  path: string;
  collection: string;
  select?: readonly string[];
};

type ResourceType = Bootcamp | Course | Review | User;

export default <T extends ResourceType>(
    collection: Collection<T>,
    populateArgs: PopulateArg[] = []
  ) =>
  async (req: Request, res: ResponseCT, next: NextFunction) => {
    try {
      await configureQuery<T>(req, res, next, collection, populateArgs);
    } catch (err) {
      next(err);
    }
  };

async function configureQuery<T extends ResourceType>(
  req: Request,
  res: ResponseCT,
  next: NextFunction,
  collection: Collection<T>,
  populateArgs: PopulateArg[]
) {
  const pipelineStages = [];

  // remove special query fields
  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'limit', 'page'];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  // mongoose operators
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/, (match) => `$${match}`);

  pipelineStages.push({ $match: JSON.parse(queryStr) });

  // SELECT FIELDS
  if (req.query.select) {
    if (typeof req.query.select !== 'string') {
      throw new ErrorResponse('select query param must be a string', 400);
    }

    const fields = req.query.select.split(',');
    pipelineStages.push({
      $project: { ...fields.reduce((acc, cur) => ({ ...acc, [cur]: 1 }), {}) },
    });
  }

  // SORT RESULTS
  let sortBy = '-createdAt';
  if (req.query.sort) {
    if (typeof req.query.sort !== 'string') {
      throw new ErrorResponse('sort query param must be a string', 400);
    }
    sortBy = req.query.sort.replace(/,/g, ' ');
  }
  pipelineStages.push({ $sort: { [sortBy]: -1 } });

  // PAGINATION
  const pageParam = req.query.page || '1';
  const limitParam = req.query.limit || '100';
  if (
    (pageParam && typeof pageParam !== 'string') ||
    (limitParam && typeof limitParam !== 'string')
  ) {
    throw new ErrorResponse('page and limit params must be strings', 400);
  }
  const page = parseInt(pageParam, 10);
  const limit = parseInt(limitParam, 10);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await collection.countDocuments();

  pipelineStages.push({ $skip: startIndex }, { $limit: limit });

  if (populateArgs) {
    for (const populateArg of populateArgs) {
      const path = populateArg.path;
      const fieldsToSelect = (populateArg.select || []).reduce(
        (acc, cur) => ({ ...acc, [cur]: 1 }),
        {}
      );
      const collectionName = populateArg.collection;
      const excludePopulate =
        req.query.select && !req.query.select.split(',').includes(path);
      if (!excludePopulate) {
        pipelineStages.push({
          $lookup: {
            from: collectionName,
            localField: path,
            foreignField: '_id',
            as: path,
          },
          $project: {
            [path]: fieldsToSelect,
          },
        });
      }
    }
  }

  const query = collection.aggregate<T>(pipelineStages);
  const results = await query.toArray();

  // Pagination result
  type Page = { page: number; limit: number };
  const pagination: {
    next?: Page;
    prev?: Page;
  } = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  next();
}
