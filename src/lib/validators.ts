import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "MEMBER"]);
export const projectStatusSchema = z.enum(["ACTIVE", "ON_HOLD", "ARCHIVED"]);
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: roleSchema.default("MEMBER"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).default(""),
  dueDate: z.string().trim().optional().default(""),
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  status: projectStatusSchema.optional(),
  dueDate: z.string().trim().optional(),
});

export const projectMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const taskCreateSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).default(""),
  assigneeId: z.string().trim().optional().default(""),
  dueDate: z.string().trim().optional().default(""),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  assigneeId: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;