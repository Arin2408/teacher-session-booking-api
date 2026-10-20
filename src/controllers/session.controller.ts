import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';

export const createSession = async (req: Request, res: Response) => {
  const session = await sessionService.createSession(req.body);
  res.status(201).json({ success: true, message: 'Session created successfully', data: session });
};

export const getAvailableSessions = async (req: Request, res: Response) => {
  const sessions = await sessionService.getAvailableSessions(Number(req.query.dateTimestamp));
  res.status(200).json({ success: true, count: sessions.length, data: sessions });
};

export const bookSession = async (req: Request, res: Response) => {
  const session = await sessionService.bookSession(req.params.id, req.body.userId);
  res.status(200).json({ success: true, message: 'Session booked successfully', data: session });
};

export const completeSession = async (req: Request, res: Response) => {
  const session = await sessionService.completeSession(req.params.id);
  res.status(200).json({ success: true, message: 'Session marked as completed', data: session });
};
