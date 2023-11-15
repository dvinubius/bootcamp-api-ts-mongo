import * as z from 'zod';
import { ObjectId } from 'mongodb';

export const ObjectIdParam = z.object({
  id: z.string().refine((id) => ObjectId.isValid(id)),
});

export type ObjectIdParam = z.infer<typeof ObjectIdParam>;
