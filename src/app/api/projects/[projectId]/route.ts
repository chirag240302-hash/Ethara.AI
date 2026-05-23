import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { canManageProject, canAccessProject } from "@/lib/permissions";
import { normalizeOptionalDate, readRequestBody } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: { include: { assignee: true, creator: true }, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!project || !canAccessProject(user, project)) {
    return jsonError("Project not found", 404);
  }

  return jsonSuccess({ project });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project || !canManageProject(user, project)) {
    return jsonError("Project not found", 404);
  }

  const body = await readRequestBody(request);
  const parsed = projectUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid project details");
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: normalizeOptionalDate(parsed.data.dueDate) } : {}),
    },
  });

  return jsonSuccess({ project: updated });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project || !canManageProject(user, project)) {
    return jsonError("Project not found", 404);
  }

  await prisma.project.delete({ where: { id: projectId } });
  return jsonSuccess({ ok: true });
}