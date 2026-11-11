import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireOrganizer } from "@/lib/session";
import { db, toIdFilter } from "@/lib/db";
import { campusTimeZone } from "@/lib/time";
import { EventForm } from "@/components/event-form";
export const metadata = { title: "Edit event" };
export default async function EditEvent({ params }) {
  const user = await requireOrganizer();
  const { id } = await params;
  const rawEvent = await db
    .collection("events")
    .findOne({ ...toIdFilter(id), organizerId: user.id });
  if (!rawEvent) notFound();
  const event = {
    id: rawEvent.id ?? rawEvent._id.toString(),
    ...rawEvent,
  };
  if (event.status === "CANCELLED" || new Date(event.startsAt) <= new Date())
    return (
      <div className="shell page-space">
        <h1 className="page-title">Editing is closed</h1>
        <p className="lead">
          Cancelled and started events keep their published history.
        </p>
        <Link className="text-link" href={"/organizer/events/" + id}>
          Back to event management →
        </Link>
      </div>
    );
  const rawClubs = await db
    .collection("clubs")
    .find({ ownerId: user.id }, { projection: { id: 1, name: 1 } })
    .sort({ name: 1 })
    .toArray();
  const clubs = rawClubs.map((club) => ({
    id: club.id ?? club._id.toString(),
    name: club.name,
  }));
  return (
    <div className="shell narrow page-space">
      <Link href={"/organizer/events/" + id} className="back-link">
        ← Event management
      </Link>
      <p className="eyebrow">EVENT MANAGEMENT</p>
      <h1 className="page-title mb-7">Edit your event.</h1>
      <div className="panel">
        <EventForm
          clubs={clubs}
          timeZone={campusTimeZone}
          initial={{
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            category: event.category,
            clubId: event.clubId,
            capacity: event.capacity,
            revision: event.revision,
            startsAtLocal: formatInTimeZone(
              event.startsAt,
              campusTimeZone,
              "yyyy-MM-dd'T'HH:mm",
            ),
            endsAtLocal: formatInTimeZone(
              event.endsAt,
              campusTimeZone,
              "yyyy-MM-dd'T'HH:mm",
            ),
          }}
        />
      </div>
    </div>
  );
}
