import { Types } from 'mongoose';
import { z } from 'zod';

export const objectId = z
  .string({ required_error: 'is required' })
  .refine((value) => Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value), {
    message: 'must be a valid ObjectId',
  });

export const idParam = z.object({ id: objectId });

/** Accepts an ISO date string or a Unix timestamp (ms) and returns a Date. */
export const dateInput = z
  .union([z.string(), z.number()], { required_error: 'is required' })
  .transform((value, ctx) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid date' });
      return z.NEVER;
    }
    return date;
  });
