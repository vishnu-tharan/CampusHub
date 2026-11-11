import Link from "next/link";
import { requireOrganizer } from "@/lib/session";
import { db } from "@/lib/db";
import { campusTimeZone } from "@/lib/time";
import { EventForm } from "@/components/event-form";
export const metadata = { title: "Create event" };
export default async function NewEvent() {
  const user = await requireOrganizer();
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
      <Link href="/organizer" className="back-link">
        ← Organizer workspace
      </Link>
      <p className="eyebrow">SOMETHING GOOD IS COMING</p>
      <h1 className="page-title mb-7">Create your next event.</h1>
      {clubs.length ? (
        <div className="panel">
          <EventForm clubs={clubs} timeZone={campusTimeZone} />
        </div>
      ) : (
        <div className="empty-state">
          <h2>Create a club first</h2>
          <p>Every event belongs to a club you manage.</p>
          <Link href="/organizer" className="button mt-4">
            Create a club
          </Link>
        </div>
      )}
    </div>
  );
}
