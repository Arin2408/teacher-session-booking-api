import { TeacherModel } from '../models/teacher.model';
import { CreateTeacherInput } from '../validators/teacher.validator';

export const createTeacher = async (input: CreateTeacherInput) => TeacherModel.create(input);
