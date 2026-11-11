import Link from "next/link";
import { Users } from "lucide-react";
import { db } from "@/lib/db";

export const metadata = { title: "Campus clubs" };

export default async function Clubs() {
  const rawClubs = await db
    .collection("clubs")
    .find({})
    .sort({ name: 1 })
    .toArray();
  const clubs = await Promise.all(
    rawClubs.map(async (club) => {
      const clubId = club.id ?? club._id.toString();
      const eventCount = await db.collection("events").countDocuments({
        clubId,
        status: "PUBLISHED",
        startsAt: { $gt: new Date() },
      });
      return {
        id: clubId,
        ...club,
        _count: { events: eventCount },
      };
    }),
  );
  return (
    <div className="shell page-space">
      <p className="eyebrow">BETTER TOGETHER</p>
      <h1 className="page-title">Find your people.</h1>
      <p className="lead">
        Discover campus clubs and explore their upcoming events.
      </p>
      {clubs.length ? (
        <div className="club-grid mt-8">
          {clubs.map((club) => (
            <article className="panel club-card" key={club.id}>
              <span className="club-icon">
                <Users size={24} />
              </span>
              <h2>
                <Link href={"/clubs/" + club.id}>{club.name}</Link>
              </h2>
              <p className="muted mt-3">{club.description}</p>
              <p className="muted text-sm mt-5">
                {club._count.events} upcoming events
              </p>
              <Link
                className="text-link mt-5 inline-block"
                href={"/clubs/" + club.id}
              >
                Visit club →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Clubs are coming soon</h2>
          <p>
            Organizers can create their first club in the organizer workspace.
          </p>
        </div>
      )}
    </div>
  );
}
