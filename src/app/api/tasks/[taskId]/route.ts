import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { canManageTask } from "@/lib/permissions";
import { normalizeOptionalDate, readRequestBody } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ taskId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { taskId } = await params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: true } },
    },
  });

  if (!task) {
    return jsonError("Task not found", 404);
  }

  if (!canManageTask(user, task.project, task.assigneeId)) {
    return jsonError("Not allowed to update this task", 403);
  }

  const body = await readRequestBody(request);
  const parsed = taskUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid task details");
  }

  const assigneeId = parsed.data.assigneeId === "" ? null : parsed.data.assigneeId;

  if (assigneeId) {
    const isMember =
      task.project.ownerId === assigneeId ||
      task.project.members.some((member: { userId: string }) => member.userId === assigneeId);

    if (!isMember) {
      return jsonError("Assignee must be part of the project", 400);
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.assigneeId !== undefined ? { assigneeId } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: normalizeOptionalDate(parsed.data.dueDate) } : {}),
    },
    include: {
      project: { select: { id: true, name: true, status: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return jsonSuccess({ task: updated });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { taskId } = await params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: true } },
    },
  });

  if (!task) {
    return jsonError("Task not found", 404);
  }

  if (!canManageTask(user, task.project, task.assigneeId)) {
    return jsonError("Not allowed to delete this task", 403);
  }

  await prisma.task.delete({ where: { id: taskId } });
  return jsonSuccess({ ok: true });
}