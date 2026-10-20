import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const createUser = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, message: 'User created successfully', data: user });
};

export const getUserSessions = async (req: Request, res: Response) => {
  const sessions = await userService.getUserSessions(req.params.id);
  res.status(200).json({ success: true, data: sessions });
};
