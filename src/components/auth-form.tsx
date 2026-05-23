"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, fieldClass, labelClass, panelClass, secondaryButtonClass } from "@/components/ui";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      form.reset();
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${panelClass} space-y-5`}>
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
      </div>

      {isSignup && (
        <div>
          <label className={labelClass} htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required className={fieldClass} />
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={8} className={fieldClass} />
      </div>

      {isSignup && (
        <div>
          <label className={labelClass} htmlFor="role">
            Role
          </label>
          <select id="role" name="role" className={fieldClass} defaultValue="MEMBER">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <p className="mt-2 text-xs leading-6 text-[rgb(var(--muted-rgb))]">
            Only the first account can keep an Admin role unless the server allows a new one.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={buttonClass} disabled={busy}>
          {busy ? "Working..." : isSignup ? "Create account" : "Sign in"}
        </button>
        <a href={isSignup ? "/login" : "/signup"} className={secondaryButtonClass}>
          {isSignup ? "Already have an account?" : "Need an account?"}
        </a>
      </div>
    </form>
  );
}