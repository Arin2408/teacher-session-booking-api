import { Types } from 'mongoose';
import { UserModel } from '../models/user.model';
import { SessionModel, SessionStatus } from '../models/session.model';
import { ApiError } from '../utils/ApiError';
import { CreateUserInput } from '../validators/user.validator';

export const createUser = async (input: CreateUserInput) => {
  const existing = await UserModel.exists({ email: input.email });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }
  // The unique index is still the source of truth for concurrent requests (handled in errorHandler).
  return UserModel.create(input);
};

/**
 * Returns the user's sessions split into upcoming (BOOKED) and completed (COMPLETED)
 * using a single aggregation pipeline with $facet.
 */
export const getUserSessions = async (userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  const [result] = await SessionModel.aggregate<{
    upcomingSessions: unknown[];
    completedSessions: unknown[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
        as: 'teacher',
      },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        teacherId: 1,
        userId: 1,
        teacher: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        completedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return {
    upcomingSessions: result?.upcomingSessions ?? [],
    completedSessions: result?.completedSessions ?? [],
  };
};
