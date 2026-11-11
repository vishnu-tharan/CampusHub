import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { db } from "./db.js";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32 || secret.startsWith("replace-")) {
  throw new Error(
    "Set BETTER_AUTH_SECRET to a random secret of at least 32 characters in .env.",
  );
}
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

export const auth = betterAuth({
  appName: "CampusHub",
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: ["STUDENT", "ORGANIZER"],
        defaultValue: "STUDENT",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  advanced: { useSecureCookies: baseURL.startsWith("https://") },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
});
