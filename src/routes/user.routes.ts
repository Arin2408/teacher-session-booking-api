import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createUserSchema, userIdParamSchema } from '../validators/user.validator';

const router = Router();

router.post('/', validate(createUserSchema), asyncHandler(userController.createUser));
router.get('/:id/sessions', validate(userIdParamSchema), asyncHandler(userController.getUserSessions));

export default router;
