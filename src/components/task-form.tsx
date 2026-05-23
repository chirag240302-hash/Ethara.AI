"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, fieldClass, labelClass, panelClass } from "@/components/ui";

type Option = {
  id: string;
  name: string;
  email: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

type TaskFormProps = {
  projects: ProjectOption[];
  people: Option[];
};

export function TaskForm({ projects, people }: TaskFormProps) {
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
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create task");
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
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">Delivery lane</p>
        <h2 className="mt-2 text-xl font-semibold">Create a task</h2>
      </div>

      <div>
        <label htmlFor="projectId" className={labelClass}>
          Project
        </label>
        <select id="projectId" name="projectId" required className={fieldClass} defaultValue="">
          <option value="" disabled>
            Select project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" name="title" type="text" required minLength={3} className={fieldClass} placeholder="Prepare sprint review deck" />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={4} className={fieldClass} placeholder="Add context, acceptance notes, or links." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select id="priority" name="priority" className={fieldClass} defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className={labelClass}>
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="assigneeId" className={labelClass}>
          Assignee
        </label>
        <select id="assigneeId" name="assigneeId" className={fieldClass} defaultValue="">
          <option value="">Unassigned</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} · {person.email}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <button type="submit" className={buttonClass} disabled={busy || projects.length === 0}>
        {busy ? "Creating..." : projects.length === 0 ? "Create a project first" : "Create task"}
      </button>
    </form>
  );
}