"use client";
import { useActionState } from "react";
import { createClubAction } from "@/app/actions";
import { ActionFeedback } from "./action-feedback";
export function ClubForm() {
  const [state, action, pending] = useActionState(createClubAction, {});
  return (
    <form action={action} className="form-stack">
      <label>
        Club name
        <input
          name="name"
          required
          minLength={3}
          maxLength={80}
          placeholder="e.g. Computing Society"
        />
      </label>
      <label>
        About the club
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          placeholder="What brings your community together?"
        />
      </label>
      <ActionFeedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Creating…" : "Create club"}
      </button>
    </form>
  );
}
