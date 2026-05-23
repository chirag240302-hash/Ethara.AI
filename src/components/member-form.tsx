"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, fieldClass, labelClass, panelClass } from "@/components/ui";

type MemberFormProps = {
  projectId: string;
  compact?: boolean;
};

export function MemberForm({ projectId, compact }: MemberFormProps) {
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
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to add member");
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
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : `${panelClass} space-y-4`}>
      {!compact && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-rgb))]">Team</p>
          <h3 className="mt-2 text-lg font-semibold">Invite a member</h3>
        </div>
      )}

      <div>
        <label htmlFor={`email-${projectId}`} className={labelClass}>
          Member email
        </label>
        <input id={`email-${projectId}`} name="email" type="email" required className={fieldClass} placeholder="teammate@company.com" />
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <button type="submit" className={buttonClass} disabled={busy}>
        {busy ? "Adding..." : "Add member"}
      </button>
    </form>
  );
}