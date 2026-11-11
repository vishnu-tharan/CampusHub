import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth.js";
import { db, toIdFilter } from "./db.js";

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  // Read permissions from MongoDB every time, so demotion takes effect immediately.
  const user = await db
    .collection("user")
    .findOne(toIdFilter(session.user.id), {
      projection: { name: 1, email: 1, role: 1, id: 1 },
    });
  if (!user) return null;
  return {
    id: user.id ?? user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role ?? "STUDENT",
  };
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOrganizer() {
  const user = await requireUser();
  if (user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}
