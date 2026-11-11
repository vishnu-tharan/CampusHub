import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Join CampusHub" };
export default async function Signup() {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="auth-shell">
      <div className="panel auth-panel">
        <p className="eyebrow">FIND YOUR PEOPLE</p>
        <h1>Make campus yours.</h1>
        <p className="muted mb-7">
          Create a student account to join campus events.
        </p>
        <AuthForm signup />
      </div>
    </div>
  );
}
