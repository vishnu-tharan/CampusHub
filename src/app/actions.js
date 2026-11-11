"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser, requireOrganizer } from "@/lib/session";
import {
  createClub,
  createEvent,
  updateEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  DomainError,
} from "@/lib/events";
function actionError(error) {
  if (error instanceof ZodError)
    return { error: error.issues[0]?.message ?? "Check your input." };
  if (error instanceof DomainError) return { error: error.message };
  console.error("CampusHub action failed", error);
  return { error: "We could not save that change. Please try again." };
}
function refreshEventPages(eventId) {
  for (const page of [
    "/events",
    "/clubs",
    "/dashboard",
    "/organizer",
    "/events/" + eventId,
    "/organizer/events/" + eventId,
    "/organizer/events/" + eventId + "/edit",
  ])
    revalidatePath(page);
  revalidatePath("/clubs/[id]", "page");
}
export async function createClubAction(_state, form) {
  const user = await requireOrganizer();
  try {
    await createClub(user, Object.fromEntries(form));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/organizer");
  revalidatePath("/clubs");
  return {
    success: "Your club is ready. You can now publish its first event.",
  };
}
export async function createEventAction(_state, form) {
  const user = await requireOrganizer();
  let eventId;
  try {
    eventId = (await createEvent(user, Object.fromEntries(form))).id;
  } catch (error) {
    return actionError(error);
  }
  refreshEventPages(eventId);
  redirect("/events/" + eventId);
}
export async function updateEventAction(eventId, _state, form) {
  const user = await requireOrganizer();
  try {
    await updateEvent(
      user,
      eventId,
      Object.fromEntries(form),
      form.get("revision"),
    );
  } catch (error) {
    return actionError(error);
  }
  refreshEventPages(eventId);
  redirect("/events/" + eventId);
}
export async function cancelEventAction(eventId, _state, form) {
  const user = await requireOrganizer();
  try {
    await cancelEvent(user, eventId, form.get("reason"), form.get("revision"));
  } catch (error) {
    return actionError(error);
  }
  refreshEventPages(eventId);
  return {
    success:
      "The event is cancelled. Students can see the reason in My campus.",
  };
}
export async function registerAction(eventId) {
  const user = await requireUser();
  try {
    await registerForEvent(user, eventId);
  } catch (error) {
    return actionError(error);
  }
  refreshEventPages(eventId);
  return { success: "Your place is confirmed." };
}
export async function cancelAction(eventId) {
  const user = await requireUser();
  try {
    await cancelRegistration(user, eventId);
  } catch (error) {
    return actionError(error);
  }
  refreshEventPages(eventId);
  return { success: "Your registration has been cancelled." };
}
