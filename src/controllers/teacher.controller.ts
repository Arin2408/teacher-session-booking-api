import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';

export const createTeacher = async (req: Request, res: Response) => {
  const teacher = await teacherService.createTeacher(req.body);
  res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
};
