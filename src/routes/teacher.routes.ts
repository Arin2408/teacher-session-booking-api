import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createTeacherSchema } from '../validators/teacher.validator';

const router = Router();

router.post('/', validate(createTeacherSchema), asyncHandler(teacherController.createTeacher));

export default router;
