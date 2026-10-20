import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  availableSessionsSchema,
  bookSessionSchema,
  createSessionSchema,
  sessionIdParamSchema,
} from '../validators/session.validator';

const router = Router();

router.post('/', validate(createSessionSchema), asyncHandler(sessionController.createSession));
router.get(
  '/available',
  validate(availableSessionsSchema),
  asyncHandler(sessionController.getAvailableSessions),
);
router.post('/:id/book', validate(bookSessionSchema), asyncHandler(sessionController.bookSession));
router.patch(
  '/:id/complete',
  validate(sessionIdParamSchema),
  asyncHandler(sessionController.completeSession),
);

export default router;
