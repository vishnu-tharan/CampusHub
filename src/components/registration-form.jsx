"use client";
import { useActionState } from "react";
import { cancelAction, registerAction } from "@/app/actions";
import { ActionFeedback } from "./action-feedback";
export function RegistrationForm({
  eventId,
  registered,
  closed = false,
  full = false,
}) {
  const action = registered
    ? cancelAction.bind(null, eventId)
    : registerAction.bind(null, eventId);
  const [state, submit, pending] = useActionState(action, {});
  let label = registered ? "Cancel registration" : "Reserve my place";
  if (!registered && full) label = "Event full";
  if (closed) label = "Registration closed";
  if (pending) label = "Saving…";
  return (
    <form action={submit}>
      <button
        className={registered ? "button secondary w-full" : "button w-full"}
        disabled={pending || closed || (!registered && full)}
      >
        {label}
      </button>
      <ActionFeedback state={state} />
    </form>
  );
}
