import { SessionModel, SessionStatus } from '../models/session.model';
import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { getUtcDayRange } from '../utils/date';
import { CreateSessionInput } from '../validators/session.validator';

export const createSession = async (input: CreateSessionInput) => {
  const teacherExists = await TeacherModel.exists({ _id: input.teacherId });
  if (!teacherExists) {
    throw ApiError.notFound('Teacher not found');
  }

  return SessionModel.create({
    teacherId: input.teacherId,
    startTime: input.startTime,
    endTime: input.endTime,
    status: SessionStatus.AVAILABLE,
  });
};

/**
 * Returns all AVAILABLE sessions whose startTime falls on the (UTC) day of the given timestamp.
 * Implemented with the MongoDB aggregation pipeline.
 */
export const getAvailableSessions = async (dateTimestamp: number) => {
  const { start, end } = getUtcDayRange(dateTimestamp);

  return SessionModel.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: start, $lt: end },
      },
    },
    { $sort: { startTime: 1 } },
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
        as: 'teacher',
      },
    },
    { $unwind: '$teacher' },
    {
      $project: {
        _id: 1,
        teacherId: 1,
        teacher: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        durationMinutes: {
          $dateDiff: { startDate: '$startTime', endDate: '$endTime', unit: 'minute' },
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
};

export const bookSession = async (sessionId: string, userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  // Atomic conditional update: only succeeds if the session is still AVAILABLE,
  // which prevents two concurrent requests from booking the same session.
  const booked = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true },
  );
  if (booked) {
    return booked;
  }

  const session = await SessionModel.findById(sessionId).lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  if (session.status === SessionStatus.BOOKED) {
    throw ApiError.conflict('Session is already booked');
  }
  throw ApiError.conflict(`Only AVAILABLE sessions can be booked (current status: ${session.status})`);
};

export const completeSession = async (sessionId: string) => {
  const completed = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true },
  );
  if (completed) {
    return completed;
  }

  const session = await SessionModel.findById(sessionId).lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  throw ApiError.conflict(
    `Only BOOKED sessions can be marked as completed (current status: ${session.status})`,
  );
};
