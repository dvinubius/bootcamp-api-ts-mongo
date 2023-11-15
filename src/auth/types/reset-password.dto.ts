import * as z from 'zod';

export const ResetPasswordDto = z.object({
  password: z.string().min(6),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;
