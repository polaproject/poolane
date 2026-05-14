import { z } from 'zod'

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
}

export const createExerciseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  skillTarget: z.string().min(1).max(50),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  videoUrl: z.string().url().optional().or(z.literal('')),
  steps: z.array(z.string().min(3)).min(1, { message: 'Cần ít nhất 1 bước' }).max(20),
  isPublished: z.boolean().default(true),
})

export const updateExerciseSchema = createExerciseSchema.partial()

export const assignExerciseSchema = z.object({
  exerciseIds: z.array(z.string().uuid()).min(1).max(10),
  studentId: z.string().uuid(),
  dueDate: z.string().optional(),
})

export const updateAssignmentSchema = z.object({
  status: z.enum(['assigned', 'completed', 'skipped']),
  studentNote: z.string().max(500).optional(),
})

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
