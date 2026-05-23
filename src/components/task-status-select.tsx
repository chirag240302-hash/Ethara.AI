"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fieldClass } from "@/components/ui";

type TaskStatusSelectProps = {
  taskId: string;
  initialStatus: string;
};

export function TaskStatusSelect({ taskId, initialStatus }: TaskStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  const updateStatus = async (nextStatus: string) => {
    setStatus(nextStatus);
    setBusy(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setStatus(initialStatus);
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(event) => updateStatus(event.target.value)}
      disabled={busy}
      className={`${fieldClass} mt-0 min-w-[10rem] py-2 text-xs`}
    >
      <option value="TODO">Todo</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="REVIEW">Review</option>
      <option value="DONE">Done</option>
    </select>
  );
}