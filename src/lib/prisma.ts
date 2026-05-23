import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client/index";

const isProduction = process.env.NODE_ENV === "production";
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
type Role = "ADMIN" | "MEMBER";
type ProjectStatus = "ACTIVE" | "ON_HOLD" | "ARCHIVED";
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectMemberRecord = {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
};

type ProjectRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  dueDate: Date | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockDb = {
  users: UserRecord[];
  projects: ProjectRecord[];
  projectMembers: ProjectMemberRecord[];
  tasks: TaskRecord[];
};

type LocalProject = ProjectRecord & {
  owner: Pick<UserRecord, "id" | "name" | "email" | "role">;
  members: Array<{ user: Pick<UserRecord, "id" | "name" | "email" | "role"> }>;
  tasks: Array<{ id: string; status: TaskStatus; dueDate: Date | null }>;
};

type LocalTask = TaskRecord & {
  project: { id: string; name: string; status: ProjectStatus };
  assignee: Pick<UserRecord, "id" | "name" | "email"> | null;
  creator: Pick<UserRecord, "id" | "name" | "email">;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockDb?: MockDb;
};

const mockAdminPasswordHash = bcrypt.hashSync("Admin1234!", 12);
const mockMemberPasswordHash = bcrypt.hashSync("Member1234!", 12);

function createId() {
  return `mock_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function ensureMockDb(): MockDb {
  if (!globalForPrisma.mockDb) {
    globalForPrisma.mockDb = {
      users: [],
      projects: [],
      projectMembers: [],
      tasks: [],
    };
  }

  const db = globalForPrisma.mockDb;

  if (!isProduction && !db.users.some((user) => user.email === "admin@teamtask.local")) {
    db.users.push({
      id: "mock_admin_user",
      name: "Team Admin",
      email: "admin@teamtask.local",
      passwordHash: mockAdminPasswordHash,
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (!isProduction && !db.users.some((user) => user.email === "member@teamtask.local")) {
    db.users.push({
      id: "mock_member_user",
      name: "Team Member",
      email: "member@teamtask.local",
      passwordHash: mockMemberPasswordHash,
      role: "MEMBER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return db;
}

function projectOwner(db: MockDb, ownerId: string) {
  const owner = db.users.find((user) => user.id === ownerId);

  if (!owner) {
    throw new Error("Owner not found");
  }

  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
  };
}

function taskRelationData(db: MockDb, task: TaskRecord): LocalTask {
  const assignee = task.assigneeId ? db.users.find((user) => user.id === task.assigneeId) : undefined;
  const creator = db.users.find((user) => user.id === task.creatorId);

  if (!creator) {
    throw new Error("Creator not found");
  }

  const project = db.projects.find((item) => item.id === task.projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    ...task,
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
    },
    assignee: assignee
      ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        }
      : null,
    creator: {
      id: creator.id,
      name: creator.name,
      email: creator.email,
    },
  };
}

function projectRelationData(db: MockDb, project: ProjectRecord): LocalProject {
  const owner = projectOwner(db, project.ownerId);
  const members = db.projectMembers
    .filter((member) => member.projectId === project.id)
    .map((member) => {
      const user = db.users.find((item) => item.id === member.userId);

      if (!user) {
        throw new Error("Project member not found");
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    });

  const tasks = db.tasks
    .filter((task) => task.projectId === project.id)
    .map((task) => ({ id: task.id, status: task.status, dueDate: task.dueDate }));

  return {
    ...project,
    owner,
    members,
    tasks,
  };
}

function matchesProjectFilter(project: ProjectRecord, filter: any, db: MockDb) {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  if (Array.isArray(filter.OR)) {
    return filter.OR.some((entry: any) => matchesProjectFilter(project, entry, db));
  }

  if (filter.ownerId && project.ownerId !== filter.ownerId) {
    return false;
  }

  if (filter.members?.some?.userId) {
    return db.projectMembers.some((member) => member.projectId === project.id && member.userId === filter.members.some.userId);
  }

  return true;
}

function makeMockPrisma() {
  const db = ensureMockDb();

  return {
    user: {
      async findUnique({ where }: { where: { id?: string; email?: string } }) {
        return db.users.find((user) => (where.id ? user.id === where.id : user.email === where.email)) ?? null;
      },
      async findMany({ select }: { select?: Record<string, boolean> } = {}) {
        const users = [...db.users].sort((first, second) => first.name.localeCompare(second.name));
        return select ? users.map((user) => pick(user, select)) : users;
      },
      async count({ where }: { where?: { role?: Role } } = {}) {
        if (!where?.role) {
          return db.users.length;
        }

        return db.users.filter((user) => user.role === where.role).length;
      },
      async create({ data, select }: { data: Omit<UserRecord, "id" | "createdAt" | "updatedAt">; select?: Record<string, boolean> }) {
        const user: UserRecord = {
          id: createId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };

        db.users.push(user);
        return select ? pick(user, select) : user;
      },
    },
    project: {
      async findMany(query: { where?: any } = {}) {
        return db.projects.filter((project) => matchesProjectFilter(project, query.where, db)).map((project) => projectRelationData(db, project));
      },
      async findUnique({ where }: { where: { id?: string; slug?: string }; include?: any }) {
        const project = db.projects.find((item) => (where.id ? item.id === where.id : item.slug === where.slug));
        return project ? projectRelationData(db, project) : null;
      },
      async create({ data }: { data: any }) {
        const project: ProjectRecord = {
          id: createId(),
          name: data.name,
          slug: data.slug,
          description: data.description ?? "",
          status: data.status ?? "ACTIVE",
          dueDate: data.dueDate ?? null,
          ownerId: data.ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        db.projects.push(project);

        if (data.members?.create) {
          for (const member of data.members.create) {
            db.projectMembers.push({
              id: createId(),
              projectId: project.id,
              userId: member.userId,
              createdAt: new Date(),
            });
          }
        }

        return projectRelationData(db, project);
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const project = db.projects.find((item) => item.id === where.id);

        if (!project) {
          throw new Error("Project not found");
        }

        if (typeof data.name === "string") project.name = data.name;
        if (typeof data.description === "string") project.description = data.description;
        if (typeof data.status === "string") project.status = data.status;
        if (Object.prototype.hasOwnProperty.call(data, "dueDate")) project.dueDate = data.dueDate ?? null;
        project.updatedAt = new Date();

        return projectRelationData(db, project);
      },
      async delete({ where }: { where: { id: string } }) {
        db.projects = db.projects.filter((item) => item.id !== where.id);
        db.projectMembers = db.projectMembers.filter((item) => item.projectId !== where.id);
        db.tasks = db.tasks.filter((item) => item.projectId !== where.id);
        return null;
      },
    },
    projectMember: {
      async upsert({ where, create }: { where: { projectId_userId: { projectId: string; userId: string } }; create: { projectId: string; userId: string } }) {
        const existing = db.projectMembers.find((item) => item.projectId === where.projectId_userId.projectId && item.userId === where.projectId_userId.userId);

        if (!existing) {
          db.projectMembers.push({
            id: createId(),
            projectId: create.projectId,
            userId: create.userId,
            createdAt: new Date(),
          });
        }

        const user = db.users.find((item) => item.id === create.userId);

        if (!user) {
          throw new Error("User not found");
        }

        return {
          id: existing?.id ?? createId(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      },
    },
    task: {
      async findMany(query: { where?: any } = {}) {
        let tasks = [...db.tasks];

        if (query.where?.projectId?.in) {
          tasks = tasks.filter((task) => query.where.projectId.in.includes(task.projectId));
        }

        return tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map((task) => taskRelationData(db, task));
      },
      async findUnique({ where }: { where: { id: string } }) {
        const task = db.tasks.find((item) => item.id === where.id);
        return task ? taskRelationData(db, task) : null;
      },
      async create({ data }: { data: any }) {
        const task: TaskRecord = {
          id: createId(),
          title: data.title,
          description: data.description ?? "",
          status: data.status ?? "TODO",
          priority: data.priority ?? "MEDIUM",
          dueDate: data.dueDate ?? null,
          projectId: data.projectId,
          assigneeId: data.assigneeId ?? null,
          creatorId: data.creatorId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        db.tasks.push(task);
        return taskRelationData(db, task);
      },
      async createMany({ data }: { data: any[] }) {
        for (const entry of data) {
          db.tasks.push({
            id: createId(),
            title: entry.title,
            description: entry.description ?? "",
            status: entry.status ?? "TODO",
            priority: entry.priority ?? "MEDIUM",
            dueDate: entry.dueDate ?? null,
            projectId: entry.projectId,
            assigneeId: entry.assigneeId ?? null,
            creatorId: entry.creatorId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      },
      async count({ where }: { where?: { projectId?: string } } = {}) {
        if (!where?.projectId) {
          return db.tasks.length;
        }

        return db.tasks.filter((task) => task.projectId === where.projectId).length;
      },
      async update({ where, data }: { where: { id: string }; data: any }) {
        const task = db.tasks.find((item) => item.id === where.id);

        if (!task) {
          throw new Error("Task not found");
        }

        if (typeof data.title === "string") task.title = data.title;
        if (typeof data.description === "string") task.description = data.description;
        if (typeof data.status === "string") task.status = data.status;
        if (typeof data.priority === "string") task.priority = data.priority;
        if (Object.prototype.hasOwnProperty.call(data, "dueDate")) task.dueDate = data.dueDate ?? null;
        if (Object.prototype.hasOwnProperty.call(data, "assigneeId")) task.assigneeId = data.assigneeId ?? null;
        task.updatedAt = new Date();

        return taskRelationData(db, task);
      },
      async delete({ where }: { where: { id: string } }) {
        db.tasks = db.tasks.filter((item) => item.id !== where.id);
        return null;
      },
    },
  };
}

function pick<T extends Record<string, unknown>>(record: T, select: Record<string, boolean>) {
  return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, record[key]]));
}

export const prisma = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }))
  : isProduction && !isProductionBuild
    ? (() => {
        throw new Error("DATABASE_URL is required in production.");
      })()
    : (makeMockPrisma() as any);

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma as PrismaClient;
}