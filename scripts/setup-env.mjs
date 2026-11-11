import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env")) {
  console.log(".env already exists; left it unchanged.");
} else {
  const example = readFileSync(".env.example", "utf8");
  writeFileSync(
    ".env",
    example.replace(
      "replace-with-a-random-secret-at-least-32-characters",
      randomBytes(32).toString("base64url"),
    ),
  );
  console.log(
    "Created .env with a new random authentication secret. Keep this file private.",
  );
}
