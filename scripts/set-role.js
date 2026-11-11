import "dotenv/config";
import { client, db } from "../src/lib/db.js";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !["STUDENT", "ORGANIZER"].includes(role)) {
    throw new Error(
      "Usage: npm run user:role -- person@example.com ORGANIZER (or STUDENT)",
    );
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = await db.collection("user").findOne({ email: cleanEmail });
  if (!user) throw new Error("No user found with email " + cleanEmail);

  const userId = user.id ?? user._id.toString();
  await db
    .collection("user")
    .updateOne({ _id: user._id }, { $set: { role: role } });
  await db
    .collection("session")
    .deleteMany({ $or: [{ userId }, { userId: user._id }] });

  console.log(
    "Updated " +
      user.email +
      " to " +
      role +
      ". Existing sessions were revoked; sign in again.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
