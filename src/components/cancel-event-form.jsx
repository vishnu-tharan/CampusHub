"use client";
import { useActionState, useState } from "react";
import { cancelEventAction } from "@/app/actions";
import { ActionFeedback } from "./action-feedback";
export function CancelEventForm({ eventId, revision }) {
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState(
    cancelEventAction.bind(null, eventId),
    {},
  );
  return (
    <details className="panel mt-6">
      <summary className="text-link">Cancel this event</summary>
      <form action={action} className="form-stack mt-5">
        <p className="muted text-sm">
          Cancellation keeps the event and registration history. New bookings
          close, and students see the reason in My campus.
        </p>
        <input type="hidden" name="revision" value={revision} />
        <label>
          Cancellation reason
          <textarea
            name="reason"
            required
            minLength={5}
            maxLength={500}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button className="button danger" disabled={pending}>
          {pending ? "Cancelling…" : "Confirm event cancellation"}
        </button>
        <ActionFeedback state={state} />
      </form>
    </details>
  );
}
