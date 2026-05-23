import type { SessionUser } from "@/lib/auth";
import type { ProjectStatus, Role, TaskStatus } from "@/lib/domain";

type ProjectLike = {
  id: string;
  ownerId: string;
  members?: Array<{ userId?: string; user?: { id?: string } }>;
  status?: ProjectStatus;
};

function getMemberUserId(member: { userId?: string; user?: { id?: string } }) {
  return member.userId ?? member.user?.id;
}

export function isAdmin(user: SessionUser | null | undefined) {
  return user?.role === "ADMIN";
}

export function canAccessProject(user: SessionUser, project: ProjectLike) {
  if (isAdmin(user)) {
    return true;
  }

  return project.ownerId === user.id || project.members?.some((member) => getMemberUserId(member) === user.id) === true;
}

export function canManageProject(user: SessionUser, project: ProjectLike) {
  return isAdmin(user) || project.ownerId === user.id;
}

export function canManageTask(user: SessionUser, project: ProjectLike, assigneeId?: string | null) {
  if (isAdmin(user) || project.ownerId === user.id) {
    return true;
  }

  return assigneeId === user.id;
}

export function isOverdue(dueDate: Date | null | undefined, status: TaskStatus) {
  return Boolean(dueDate && dueDate < new Date() && status !== "DONE");
}

export function accessibleProjectWhere(user: SessionUser) {
  if (isAdmin(user)) {
    return {};
  }

  return {
    OR: [
      { ownerId: user.id },
      {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    ],
  };
}