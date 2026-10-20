import { z } from 'zod';
import { dateInput, idParam, objectId } from './common';

export const createSessionSchema = z.object({
  body: z
    .object({
      teacherId: objectId,
      startTime: dateInput,
      endTime: dateInput,
    })
    .refine((data) => data.endTime.getTime() > data.startTime.getTime(), {
      message: 'endTime must be greater than startTime',
      path: ['endTime'],
    }),
});

export const availableSessionsSchema = z.object({
  query: z.object({
    dateTimestamp: z
      .string({ required_error: 'is required' })
      .regex(/^\d+$/, 'must be a numeric Unix timestamp (seconds or milliseconds)')
      .transform(Number),
  }),
});

export const bookSessionSchema = z.object({
  params: idParam,
  body: z.object({ userId: objectId }),
});

export const sessionIdParamSchema = z.object({ params: idParam });

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
