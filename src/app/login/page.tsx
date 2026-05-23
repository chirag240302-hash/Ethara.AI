import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-6">
          <Link href="/" className="text-sm font-medium text-[rgb(var(--accent-strong-rgb))]">
            Team Task Manager
          </Link>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">Sign back in and keep the team moving.</h1>
          <p className="max-w-lg text-base leading-8 text-[rgb(var(--muted-rgb))]">
            View live status, adjust assignments, and keep an eye on what is late without fighting the interface.
          </p>
        </section>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}