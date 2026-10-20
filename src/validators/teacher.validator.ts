import { z } from 'zod';

export const createTeacherSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'is required' }).trim().min(1, 'cannot be empty'),
    email: z.string({ required_error: 'is required' }).trim().toLowerCase().email('must be a valid email'),
    specialization: z.string({ required_error: 'is required' }).trim().min(1, 'cannot be empty'),
    experience: z.number({ required_error: 'is required' }).min(0, 'cannot be negative'),
  }),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>['body'];
