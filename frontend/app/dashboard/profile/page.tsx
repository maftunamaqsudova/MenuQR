"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { Restaurant } from "@/lib/types";
import Field from "@/components/Field";
import ImageUpload from "@/components/ImageUpload";

export default function ProfilePage() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Restaurant>("/restaurant/me")
      .then((r) => {
        setSlug(r.slug);
        setName(r.name);
        setDescription(r.description ?? "");
        setAddress(r.address ?? "");
        setPhone(r.phone ?? "");
        setLogoUrl(r.logoUrl);
        setCoverImageUrl(r.coverImageUrl);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api<Restaurant>("/restaurant/me", {
        method: "PUT",
        body: JSON.stringify({ name, description, address, phone, logoUrl, coverImageUrl }),
      });
      setSaved(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Restaurant profile</h1>
        <p className="text-sm text-gray-500">
          Public address: <Link href={`/r/${slug}`} className="text-emerald-700 hover:underline">/r/{slug}</Link>{" "}
          (it never changes, so printed QR codes keep working)
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Saved.</p>}

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <Field label="Restaurant name" required minLength={2} maxLength={150}
          value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
          <textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        </label>

        <Field label="Address" maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} />
        <Field label="Phone" type="tel" maxLength={30} placeholder="+998 90 123 45 67"
          value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
        <ImageUpload label="Logo" value={logoUrl} onChange={setLogoUrl} boxClass="h-24 w-24" />
        <ImageUpload label="Cover image" value={coverImageUrl} onChange={setCoverImageUrl} boxClass="h-28 w-48" />
      </div>

      <button type="submit" disabled={saving}
        className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}