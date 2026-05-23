import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { canManageProject } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { readRequestBody } from "@/lib/request";
import { projectMemberSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
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
  const parsed = projectMemberSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid email");
  }

  const memberUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!memberUser) {
    return jsonError("No user found for that email", 404);
  }

  const membership = await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: memberUser.id,
      },
    },
    create: {
      projectId,
      userId: memberUser.id,
    },
    update: {},
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return jsonSuccess({ membership }, 201);
}