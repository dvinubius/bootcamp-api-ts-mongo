import * as z from 'zod';

export const UpdatePasswordDto = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordDto>;
