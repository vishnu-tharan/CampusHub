import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/session";
import { db, toIdFilter } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/time";
import { CancelEventForm } from "@/components/cancel-event-form";
export const metadata = { title: "Event management" };
export default async function EventManagement({ params }) {
  const user = await requireOrganizer();
  const { id } = await params;
  const rawEvent = await db
    .collection("events")
    .findOne({ ...toIdFilter(id), organizerId: user.id });
  if (!rawEvent) notFound();
  const eventId = rawEvent.id ?? rawEvent._id.toString();
  const rawRegistrations = await db
    .collection("registrations")
    .find({ eventId })
    .sort({ createdAt: 1 })
    .toArray();
  const registrations = await Promise.all(
    rawRegistrations.map(async (reg) => {
      const regUser = await db
        .collection("user")
        .findOne(toIdFilter(reg.userId), {
          projection: { name: 1, email: 1 },
        });
      return {
        id: reg.id ?? reg._id.toString(),
        createdAt: reg.createdAt,
        user: {
          name: regUser?.name ?? "Student",
          email: regUser?.email ?? "",
        },
      };
    }),
  );
  const event = {
    id: eventId,
    ...rawEvent,
    registrations,
  };
  const canEdit = event.status === "PUBLISHED" && event.startsAt > new Date();
  return (
    <div className="shell page-space">
      <Link href="/organizer" className="back-link">
        ← Organizer workspace
      </Link>
      <p className="eyebrow">ATTENDEE LIST</p>
      <h1 className="page-title">{event.title}</h1>
      <p className="lead">
        {event.registrations.length} / {event.capacity} registered ·{" "}
        {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
      </p>
      {event.status === "CANCELLED" && (
        <div className="notice error">
          <strong>Cancelled</strong>
          <p>{event.cancellationReason}</p>
        </div>
      )}
      {canEdit && (
        <Link
          href={"/organizer/events/" + id + "/edit"}
          className="button mt-6"
        >
          Edit event
        </Link>
      )}
      <div className="panel table-panel mt-8">
        {event.registrations.length ? (
          <table>
            <caption className="sr-only">
              Students registered for {event.title}
            </caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered on</th>
              </tr>
            </thead>
            <tbody>
              {event.registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{registration.user.name}</td>
                  <td>{registration.user.email}</td>
                  <td>{formatDate(registration.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>No registrations yet</h3>
            <p>Students will appear here after reserving a place.</p>
          </div>
        )}
      </div>
      {event.status === "PUBLISHED" && event.endsAt > new Date() && (
        <CancelEventForm eventId={id} revision={event.revision} />
      )}
      <Link href={"/events/" + id} className="text-link mt-5 inline-block">
        View public event page →
      </Link>
    </div>
  );
}
