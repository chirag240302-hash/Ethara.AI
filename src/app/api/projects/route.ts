import { ProjectStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { accessibleProjectWhere, isAdmin } from "@/lib/permissions";
import { normalizeOptionalDate, readRequestBody } from "@/lib/request";
import { projectCreateSchema } from "@/lib/validators";

function createSlug(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "project"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const projects = await prisma.project.findMany({
    where: accessibleProjectWhere(user),
    orderBy: [{ updatedAt: "desc" }],
    include: {
      owner: {
        select: { id: true, name: true, email: true, role: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      tasks: {
        select: { id: true, status: true, dueDate: true },
      },
    },
  });

  return jsonSuccess({ projects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  if (!isAdmin(user)) {
    return jsonError("Only admins can create projects", 403);
  }

  const body = await readRequestBody(request);
  const parsed = projectCreateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid project details");
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      status: ProjectStatus.ACTIVE,
      dueDate: normalizeOptionalDate(parsed.data.dueDate),
      slug: createSlug(parsed.data.name),
      ownerId: user.id,
      members: {
        create: [{ userId: user.id }],
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, role: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  return jsonSuccess({ project }, 201);
}