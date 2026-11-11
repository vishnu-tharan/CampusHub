import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Sign in" };
export default async function Login() {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="auth-shell">
      <div className="panel auth-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Good to see you.</h1>
        <p className="muted mb-7">Your next campus experience is waiting.</p>
        <AuthForm />
      </div>
    </div>
  );
}
