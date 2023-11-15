import * as z from 'zod';
import { WithId } from 'mongodb';

import { db } from '../config/db.js';

import { Bootcamp } from '../bootcamp/bootcamp-model.js';
import { ROLES } from './types/role.enum.type.js';

export const UserCreateDto = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(ROLES),
  password: z.string().min(6),
});

export type UserCreateDto = z.infer<typeof UserCreateDto>;
export type UserUpdateDto = Partial<Omit<UserCreateDto, 'role' | 'password'>>;

// restricting possibly populated fields
export const USER_BC_OWNED_FIELDS = [
  'name',
  'description',
  'averageRating',
] as const;
export const USER_BC_JOINED_FIELDS = ['name', 'description'] as const;

// subdocs kept flexible as partials, but guaranteed with IDs
export type BootcampOwnedSubDoc = WithId<
  Partial<Pick<Bootcamp, (typeof USER_BC_OWNED_FIELDS)[number]>>
>;

export type BootcampJoinedSubDoc = WithId<
  Partial<Pick<Bootcamp, (typeof USER_BC_JOINED_FIELDS)[number]>>
>;

export type User = UserCreateDto & {
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  bootcampOwned?: BootcampOwnedSubDoc;
  bootcampsJoined: BootcampJoinedSubDoc[];
};

export const Users = db.collection<User>('users');
