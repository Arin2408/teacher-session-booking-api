import { z } from 'zod';
import { idParam } from './common';

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'is required' }).trim().min(1, 'cannot be empty'),
    email: z.string({ required_error: 'is required' }).trim().toLowerCase().email('must be a valid email'),
    phone: z
      .string({ required_error: 'is required' })
      .trim()
      .regex(/^\+?[0-9\s-]{7,15}$/, 'must be a valid phone number'),
  }),
});

export const userIdParamSchema = z.object({ params: idParam });

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
