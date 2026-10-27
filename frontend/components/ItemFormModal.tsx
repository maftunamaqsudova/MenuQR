"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import Field from "./Field";
import ImageUpload from "./ImageUpload";

type Props = {
  item: MenuItem | null; // null = creating a new item
  categories: Category[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function ItemFormModal({ item, categories, defaultCategoryId, onClose, onSaved }: Props) {
  const [categoryId, setCategoryId] = useState<number>(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [image, setImage] = useState<string | null>(item?.imageUrl ?? null);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = JSON.stringify({
        categoryId,
        name,
        description,
        price: Number(price),
        imageUrl: image,
        isAvailable,
      });
      if (item) await api(`/menu-items/${item.id}`, { method: "PUT", body });
      else await api("/menu-items", { method: "POST", body });
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 className="text-xl font-bold">{item ? "Edit item" : "New menu item"}</h2>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Category</span>
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <Field label="Name" required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
          <textarea className={inputClass} rows={3} maxLength={1000}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <Field label="Price (UZS)" type="number" required min={0} step="any" inputMode="decimal"
          value={price} onChange={(e) => setPrice(e.target.value)} />

        <ImageUpload label="Photo" value={image} onChange={setImage} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          In stock (customers can order it)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}