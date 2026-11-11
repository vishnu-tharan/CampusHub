"use client";
import { useActionState, useState } from "react";
import { toUtcTimestamp } from "@/lib/time";
import { createEventAction, updateEventAction } from "@/app/actions";
import { categories, categoryLabels } from "@/lib/validation";
import { ActionFeedback } from "./action-feedback";
export function EventForm({ clubs, timeZone = "Asia/Colombo", initial }) {
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    category: initial?.category ?? "TECHNOLOGY",
    clubId: initial?.clubId ?? "",
    capacity: String(initial?.capacity ?? 50),
    startsAtLocal: initial?.startsAtLocal ?? "",
    endsAtLocal: initial?.endsAtLocal ?? "",
  });
  function handleFieldChange(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  const [state, action, pending] = useActionState(async (previous, data) => {
    const startText = String(data.get("startsAtLocal") ?? "");
    const endText = String(data.get("endsAtLocal") ?? "");
    try {
      data.set("startsAt", toUtcTimestamp(startText, timeZone));
      data.set("endsAt", toUtcTimestamp(endText, timeZone));
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Enter valid start and end times.",
      };
    }
    return initial
      ? updateEventAction(initial.id, previous, data)
      : createEventAction(previous, data);
  }, {});
  return (
    <form action={action} className="form-stack">
      {initial && (
        <input type="hidden" name="revision" value={initial.revision} />
      )}
      <label>
        Event title
        <input
          name="title"
          required
          minLength={5}
          maxLength={120}
          value={values.title}
          onChange={handleFieldChange}
          placeholder="Give your event a memorable name"
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          value={values.description}
          onChange={handleFieldChange}
        />
      </label>
      <div className="form-grid">
        <div className="form-stack">
          <label htmlFor="event-club">Club</label>
          <select
            id="event-club"
            name="clubId"
            required
            value={values.clubId}
            onChange={handleFieldChange}
          >
            <option value="">Choose your club</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-stack">
          <label htmlFor="event-category">Category</label>
          <select
            id="event-category"
            name="category"
            required
            value={values.category}
            onChange={handleFieldChange}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label>
        Location
        <input
          name="location"
          required
          minLength={3}
          maxLength={160}
          value={values.location}
          onChange={handleFieldChange}
        />
      </label>
      <p className="notice">
        Enter event times in <strong>{timeZone}</strong>.
      </p>
      <div className="form-grid">
        <label>
          Starts at
          <input
            name="startsAtLocal"
            type="datetime-local"
            required
            value={values.startsAtLocal}
            onInput={handleFieldChange}
          />
        </label>
        <label>
          Ends at
          <input
            name="endsAtLocal"
            type="datetime-local"
            required
            value={values.endsAtLocal}
            onInput={handleFieldChange}
          />
        </label>
      </div>
      <label>
        Number of places
        <input
          name="capacity"
          type="number"
          required
          min={1}
          max={10000}
          value={values.capacity}
          onChange={handleFieldChange}
        />
      </label>
      {initial && (
        <p className="muted text-sm">
          Capacity cannot be lower than the number of registered students.
        </p>
      )}
      <ActionFeedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : initial ? "Save changes" : "Publish event"}
      </button>
    </form>
  );
}
