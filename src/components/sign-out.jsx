"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="nav-link"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error) setError("Could not sign out. Try again.");
            else {
              router.push("/events");
              router.refresh();
            }
          } catch {
            setError("Could not sign out. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <span role="alert" className="text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
