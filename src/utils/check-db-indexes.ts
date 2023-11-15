import { Reviews } from '../review/review-model.js';
import { db } from '../config/db.js';
import { Users } from '../user/user-model.js';

export const createIndexes = async () => {
  Users.createIndex({ email: 1 }, { unique: true });
  Reviews.createIndex({ bootcamp: 1, author: 1 }, { unique: true });
};

export const deleteIndexes = async () => {
  await db.command({ dropIndexes: 'reviews', index: '*' });
};

export const checkDbIndexes = async () => {
  // create indexes if they don't exist
  const reviewsIndexes = await db.indexInformation('reviews');
  if (reviewsIndexes.length === 0) await createIndexes();
};
