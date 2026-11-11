"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function AuthForm({ signup = false }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: String(data.get("email")).trim().toLowerCase(),
        password: String(data.get("password")),
      };
      const result = signup
        ? await authClient.signUp.email({
            ...credentials,
            name: String(data.get("name")).trim(),
          })
        : await authClient.signIn.email(credentials);
      if (result.error)
        setError(
          result.error.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : signup
              ? (result.error.message ?? "We could not create your account.")
              : "Sign-in failed. Check your email and password.",
        );
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {signup && (
        <label>
          Full name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
          />
        </label>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@university.edu"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete={signup ? "new-password" : "current-password"}
        />
      </label>
      {signup && (
        <p className="muted text-sm">
          Use at least 12 characters. New accounts get student access.
        </p>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <button className="button w-full" disabled={pending}>
        {pending ? "Please wait…" : signup ? "Create your account" : "Sign in"}
      </button>
      <p className="muted text-sm text-center">
        {signup ? "Already part of CampusHub? " : "New here? "}
        <Link className="text-link" href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
