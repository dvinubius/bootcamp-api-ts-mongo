import { ObjectId } from 'mongodb';
import * as z from 'zod';

export const RegisterForBootcampDto = z.object({
  user: z.string().refine((v) => ObjectId.isValid(v)),
});

export type RegisterForBootcampDto = z.infer<typeof RegisterForBootcampDto>;
