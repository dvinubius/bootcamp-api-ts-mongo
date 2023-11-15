import * as z from 'zod';
import { ObjectId, WithId } from 'mongodb';

import { db } from '../config/db.js';
import { User } from '../user/user-model.js';
import { Bootcamp } from '../bootcamp/bootcamp-model.js';
import { PopulateArg } from '../middleware/advanced-results.js';

export const ReviewCreateDto = z.object({
  title: z.string().min(3).max(100),
  text: z.string().min(10),
  rating: z.number().min(1).max(10),
});

export type ReviewCreateDto = z.infer<typeof ReviewCreateDto>;
export type ReviewUpdateDto = Partial<ReviewCreateDto>;

// restricting possibly populated fields
export const REVIEW_BOOTCAMP_FIELDS = ['name'] as const;
export const REVIEW_AUTHOR_FIELDS = ['name', 'email'] as const;

// subdocs kept flexible as partials, but guaranteed with IDs
export type BootcampSubDoc = WithId<
  Partial<Pick<Bootcamp, (typeof REVIEW_BOOTCAMP_FIELDS)[number]>>
>;
export type AuthorSubDoc = WithId<
  Partial<Pick<User, (typeof REVIEW_AUTHOR_FIELDS)[number]>>
>;

export type Review = ReviewCreateDto & {
  bootcamp: BootcampSubDoc;
  author: ObjectId;
};

export type ReviewPopulated = Review & {
  author: AuthorSubDoc;
};

export const Reviews = db.collection<Review>('reviews');

// advancedSearch middleware config
export const REVIEW_DEFAULT_POPULATE: PopulateArg[] = [
  { path: 'author', collection: 'users', select: REVIEW_AUTHOR_FIELDS },
];
