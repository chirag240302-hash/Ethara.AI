import { redirect } from "next/navigation";
import { BarChart3, ClipboardList, FolderKanban, Users } from "lucide-react";
import { MemberForm } from "@/components/member-form";
import { LogoutButton } from "@/components/logout-button";
import { ProjectForm } from "@/components/project-form";
import { TaskForm } from "@/components/task-form";
import { TaskStatusSelect } from "@/components/task-status-select";
import { badgeClass, panelClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { isAdmin } from "@/lib/permissions";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function statusTone(status: string) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "REVIEW":
      return "bg-amber-100 text-amber-800";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const data = await getDashboardData(currentUser);
  const admin = isAdmin(currentUser);

  return (
    <main className="page-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
      <header className="glass-card flex flex-col gap-5 rounded-[2rem] border border-[rgb(var(--line-rgb))] px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--muted-rgb))]">Team Task Manager</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hello, {currentUser.name}</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted-rgb))]">
            {admin ? "You control projects, members, and task flow." : "You can follow the work assigned to your team."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[rgb(var(--line-rgb))] bg-white px-4 py-2 text-sm">
            {currentUser.role}
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Projects", value: data.stats.totalProjects, icon: FolderKanban },
          { label: "Tasks", value: data.stats.totalTasks, icon: ClipboardList },
          { label: "Open projects", value: data.openProjects, icon: Users },
          { label: "Overdue", value: data.stats.overdue, icon: BarChart3 },
        ].map((item) => (
          <article key={item.label} className={`${panelClass} flex items-start justify-between gap-4`}>
            <div>
              <p className="text-sm text-[rgb(var(--muted-rgb))]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            </div>
            <item.icon className="h-8 w-8 text-[rgb(var(--accent-strong-rgb))]" />
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">Projects</p>
                <h2 className="mt-2 text-xl font-semibold">Portfolio overview</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${badgeClass} bg-slate-100 text-slate-700`}>{data.stats.done} done</span>
                <span className={`${badgeClass} bg-emerald-100 text-emerald-700`}>{data.stats.completionRate}% complete</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {data.projects.length ? (
                data.projects.map((project) => {
                  const completed = project.tasks.filter((task) => task.status === "DONE").length;
                  const percent = project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0;

                  return (
                    <article key={project.id} className="rounded-[1.35rem] border border-[rgb(var(--line-rgb))] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted-rgb))]">{project.status}</p>
                          <h3 className="mt-2 text-lg font-semibold">{project.name}</h3>
                        </div>
                        <span className="rounded-full bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-xs font-semibold text-[rgb(var(--accent-strong-rgb))]">
                          {project.tasks.length} tasks
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted-rgb))]">{project.description || "No description yet."}</p>
                      <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-[rgb(var(--accent-rgb))]" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-[rgb(var(--muted-rgb))]">
                        <span>{percent}% complete</span>
                        <span>Due {formatDate(project.dueDate)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`${badgeClass} bg-slate-100 text-slate-700`}>{project.owner.name}</span>
                        {project.members.map((member) => (
                          <span key={member.user.id} className={`${badgeClass} bg-[rgba(var(--accent-rgb),0.1)] text-[rgb(var(--accent-strong-rgb))]`}>
                            {member.user.name}
                          </span>
                        ))}
                      </div>
                      {admin && (
                        <div className="mt-5 border-t border-dashed border-[rgb(var(--line-rgb))] pt-4">
                          <MemberForm projectId={project.id} compact />
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-[rgb(var(--line-rgb))] bg-white/70 p-6 text-sm text-[rgb(var(--muted-rgb))]">
                  No projects yet. {admin ? "Create the first one on the right." : "Ask an admin to add you to a project."}
                </div>
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">Tasks</p>
                <h2 className="mt-2 text-xl font-semibold">Latest work</h2>
              </div>
              <span className={`${badgeClass} bg-amber-100 text-amber-800`}>{data.stats.overdue} overdue</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-[rgb(var(--line-rgb))] bg-white">
              <div className="grid grid-cols-[1.25fr_0.8fr_0.8fr_0.75fr_0.9fr] gap-3 border-b border-[rgb(var(--line-rgb))] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted-rgb))]">
                <span>Task</span>
                <span>Project</span>
                <span>Assignee</span>
                <span>Status</span>
                <span>Due</span>
              </div>
              <div className="divide-y divide-[rgb(var(--line-rgb))]">
                {data.tasks.length ? (
                  data.tasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-[1.25fr_0.8fr_0.8fr_0.75fr_0.9fr] gap-3 px-4 py-4 text-sm">
                      <div>
                        <p className="font-medium text-[rgb(var(--foreground-rgb))]">{task.title}</p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted-rgb))]">Created by {task.creator.name}</p>
                      </div>
                      <div className="text-[rgb(var(--muted-rgb))]">{task.project.name}</div>
                      <div className="text-[rgb(var(--muted-rgb))]">{task.assignee?.name ?? "Unassigned"}</div>
                      <div>
                        <TaskStatusSelect taskId={task.id} initialStatus={task.status} />
                      </div>
                      <div className="space-y-2">
                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(task.status)}`}>{task.status}</div>
                        <p className={`text-xs ${task.dueDate && task.dueDate < new Date() && task.status !== "DONE" ? "text-red-600" : "text-[rgb(var(--muted-rgb))]"}`}>
                          {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-[rgb(var(--muted-rgb))]">No tasks yet. Create the first task to start tracking progress.</div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {admin && <ProjectForm />}
          <TaskForm
            projects={data.projects.map((project) => ({ id: project.id, name: project.name }))}
            people={data.people.map((person: { id: string; name: string; email: string }) => ({
              id: person.id,
              name: person.name,
              email: person.email,
            }))}
          />
        </aside>
      </section>
    </main>
  );
}