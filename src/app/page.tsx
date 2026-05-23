import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CheckCircle2, KanbanSquare, LockKeyhole, Sparkles, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const highlights = [
  {
    icon: KanbanSquare,
    title: "Project control",
    text: "Create projects, assign teammates, and keep every delivery in one place.",
  },
  {
    icon: CheckCircle2,
    title: "Task progress",
    text: "Track status changes, due dates, and overdue work without losing context.",
  },
  {
    icon: Users,
    title: "Role-based access",
    text: "Admins manage the team. Members stay focused on the work that matters.",
  },
  {
    icon: BarChart3,
    title: "Operational visibility",
    text: "See completion rates, blocked work, and late items at a glance.",
  },
];

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
      <section className="glass-card relative overflow-hidden rounded-[2rem] border border-[rgb(var(--line-rgb))] px-6 py-8 sm:px-10 lg:px-14">
        <div className="absolute inset-0 subtle-grid opacity-40" />
        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.08)] px-4 py-2 text-sm font-medium text-[rgb(var(--accent-strong-rgb))]">
              <Sparkles className="h-4 w-4" />
              Team Task Manager for product teams
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-[rgb(var(--foreground-rgb))] sm:text-5xl lg:text-6xl">
                Ship projects with clean ownership, real accountability, and a dashboard that tells the truth.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[rgb(var(--muted-rgb))] sm:text-lg">
                Built for interview review and real team use: secure auth, Admin/Member access, project controls, task assignment, status tracking, and overdue visibility backed by a database and REST APIs.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[rgb(var(--accent-rgb))] px-6 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[rgb(var(--accent-strong-rgb))]"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[rgb(var(--line-rgb))] bg-white/80 px-6 font-semibold text-[rgb(var(--foreground-rgb))] transition hover:border-[rgba(var(--accent-rgb),0.25)] hover:bg-white"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-[rgb(var(--line-rgb))] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between rounded-3xl bg-slate-950 px-5 py-4 text-white">
              <div>
                <p className="text-sm text-slate-300">Live control room</p>
                <p className="text-2xl font-semibold">Everything in one place</p>
              </div>
              <LockKeyhole className="h-10 w-10 text-amber-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Access model", "Admin / Member"],
                ["Database", "PostgreSQL + Prisma"],
                ["API style", "REST + JSON"],
                ["Deployment", "Railway-ready"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-[rgb(var(--line-rgb))] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">{label}</p>
                  <p className="mt-2 text-base font-semibold text-[rgb(var(--foreground-rgb))]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <article key={item.title} className="glass-card rounded-[1.5rem] border border-[rgb(var(--line-rgb))] p-5">
            <item.icon className="h-5 w-5 text-[rgb(var(--accent-strong-rgb))]" />
            <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted-rgb))]">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
