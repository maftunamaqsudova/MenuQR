"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "@/components/Field";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", restaurantName: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Create your restaurant</h1>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <Field label="Your name" required minLength={2} maxLength={100} autoComplete="name"
          value={form.name} onChange={set("name")} />
        <Field label="Restaurant name" required minLength={2} maxLength={150}
          value={form.restaurantName} onChange={set("restaurantName")} />
        <Field label="Email" type="email" required autoComplete="email"
          value={form.email} onChange={set("email")} />
        <Field label="Password (min. 8 characters)" type="password" required minLength={8} maxLength={100}
          autoComplete="new-password" value={form.password} onChange={set("password")} />

        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {submitting ? "Creating..." : "Create account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}