import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accessibleProjectWhere } from "@/lib/permissions";
import type { ProjectStatus, Role, TaskStatus } from "@/lib/domain";

type DashboardProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: Date | null;
  owner: { id: string; name: string; email: string; role: Role };
  members: Array<{ user: { id: string; name: string; email: string; role: Role } }>;
  tasks: Array<{ id: string; status: TaskStatus; dueDate: Date | null }>;
};

type DashboardTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  project: { id: string; name: string; status: ProjectStatus };
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string; email: string };
};

function uniquePeople(projects: DashboardProject[]) {
  const map = new Map<string, { id: string; name: string; email: string; role: Role }>();

  for (const project of projects) {
    map.set(project.owner.id, project.owner);

    for (const member of project.members) {
      map.set(member.user.id, member.user);
    }
  }

  return Array.from(map.values()).sort((first: { name: string }, second: { name: string }) =>
    first.name.localeCompare(second.name),
  );
}

async function getWorkspacePeople() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return users.sort((first: { name: string }, second: { name: string }) => first.name.localeCompare(second.name));
}

export async function getDashboardData(user: SessionUser) {
  const projects = (await prisma.project.findMany({
    where: accessibleProjectWhere(user),
    orderBy: [{ updatedAt: "desc" }],
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
  })) as DashboardProject[];

  const projectIds = projects.map((project) => project.id);

  const tasks = (projectIds.length
    ? await prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 30,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : []) as DashboardTask[];

  const now = new Date();
  const people = await getWorkspacePeople();
  const completionRate = tasks.length
    ? Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100)
    : 0;

  const stats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    todo: tasks.filter((task) => task.status === "TODO").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    review: tasks.filter((task) => task.status === "REVIEW").length,
    done: tasks.filter((task) => task.status === "DONE").length,
    overdue: tasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== "DONE").length,
    completionRate,
  };

  const openProjects = projects.filter((project) => project.status !== "ARCHIVED").length;

  return {
    user,
    stats,
    projects,
    tasks,
    people,
    openProjects,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;