"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, fieldClass, labelClass, panelClass } from "@/components/ui";

export function ProjectForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create project");
      }

      form.reset();
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
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">Admin workspace</p>
        <h2 className="mt-2 text-xl font-semibold">Create a project</h2>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Project name
        </label>
        <input id="name" name="name" type="text" required minLength={3} className={fieldClass} placeholder="Website redesign" />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={4} className={fieldClass} placeholder="What needs to ship and why it matters." />
      </div>

      <div>
        <label htmlFor="dueDate" className={labelClass}>
          Due date
        </label>
        <input id="dueDate" name="dueDate" type="date" className={fieldClass} />
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <button type="submit" className={buttonClass} disabled={busy}>
        {busy ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}