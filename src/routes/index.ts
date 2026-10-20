import { Router } from 'express';
import sessionRoutes from './session.routes';
import teacherRoutes from './teacher.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/sessions', sessionRoutes);

export default router;
