"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={handleLogout} className={buttonClass} disabled={busy}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}