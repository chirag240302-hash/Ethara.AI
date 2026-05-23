import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { accessibleProjectWhere, canAccessProject } from "@/lib/permissions";
import { normalizeOptionalDate, readRequestBody } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { taskCreateSchema } from "@/lib/validators";

type ProjectWithMembers = {
  id: string;
  ownerId: string;
  members: Array<{ userId: string }>;
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const projects = (await prisma.project.findMany({
    where: accessibleProjectWhere(user),
    select: { id: true },
  })) as Array<{ id: string }>;

  const projectIds = projects.map((project) => project.id);

  const tasks = projectIds.length
    ? await prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: [{ updatedAt: "desc" }],
        include: {
          project: { select: { id: true, name: true, status: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      })
    : [];

  return jsonSuccess({ tasks });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readRequestBody(request);
  const parsed = taskCreateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid task details");
  }

  const project = (await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { members: true },
  })) as ProjectWithMembers | null;

  if (!project || !canAccessProject(user, project)) {
    return jsonError("Project not found", 404);
  }

  const assigneeId = parsed.data.assigneeId || undefined;

  if (assigneeId) {
    const isMember =
      project.ownerId === assigneeId ||
      project.members.some((member: { userId?: string; user?: { id?: string } }) => member.userId === assigneeId || member.user?.id === assigneeId);

    if (!isMember) {
      return jsonError("Assignee must be part of the project", 400);
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueDate: normalizeOptionalDate(parsed.data.dueDate),
      assigneeId,
      creatorId: user.id,
    },
    include: {
      project: { select: { id: true, name: true, status: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return jsonSuccess({ task }, 201);
}