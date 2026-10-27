"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, imageUrl } from "@/lib/api";
import { errMsg, formatPrice } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import ItemFormModal from "@/components/ItemFormModal";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<number | "all">("all");
  const [newCategory, setNewCategory] = useState("");
  const [editingCat, setEditingCat] = useState<{ id: number; name: string } | null>(null);
  const [modal, setModal] = useState<{ item: MenuItem | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        api<Category[]>("/categories"),
        api<MenuItem[]>("/menu-items"),
      ]);
      setCategories(c);
      setItems(i);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ----- categories -----
  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setError("");
    try {
      await api("/categories", { method: "POST", body: JSON.stringify({ name: newCategory }) });
      setNewCategory("");
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function renameCategory(e: FormEvent) {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;
    setError("");
    try {
      await api(`/categories/${editingCat.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingCat.name }),
      });
      setEditingCat(null);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function deleteCategory(c: Category) {
    const warning = c.itemCount > 0
      ? `Delete "${c.name}" and its ${c.itemCount} item(s)?`
      : `Delete "${c.name}"?`;
    if (!confirm(warning)) return;
    setError("");
    try {
      await api(`/categories/${c.id}`, { method: "DELETE" });
      if (filter === c.id) setFilter("all");
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  // ----- items -----
  async function toggleAvailable(item: MenuItem) {
    setError("");
    try {
      const updated = await api<MenuItem>(`/menu-items/${item.id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      setItems((list) => list.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    setError("");
    try {
      await api(`/menu-items/${item.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const visible = filter === "all" ? items : items.filter((i) => i.categoryId === filter);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Menu</h1>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ---------- Categories ---------- */}
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Categories</h2>

        {categories.length === 0 && (
          <p className="text-sm text-gray-500">No categories yet. Add one (for example Drinks, Main Dishes, Desserts).</p>
        )}

        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
              {editingCat?.id === c.id ? (
                <form onSubmit={renameCategory} className="flex flex-1 gap-2">
                  <input autoFocus maxLength={100} value={editingCat.name}
                    onChange={(e) => setEditingCat({ id: c.id, name: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1" />
                  <button className="text-sm font-medium text-emerald-700">Save</button>
                  <button type="button" onClick={() => setEditingCat(null)} className="text-sm text-gray-500">Cancel</button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 truncate">
                    {c.name} <span className="text-sm text-gray-400">({c.itemCount})</span>
                  </span>
                  <span className="flex shrink-0 gap-3 text-sm">
                    <button onClick={() => setEditingCat({ id: c.id, name: c.name })} className="text-gray-600 hover:text-emerald-700">Rename</button>
                    <button onClick={() => deleteCategory(c)} className="text-gray-600 hover:text-red-600">Delete</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={addCategory} className="flex gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name" maxLength={100}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-600" />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">Add</button>
        </form>
      </section>

      {/* ---------- Items ---------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Items</h2>
          <button onClick={() => setModal({ item: null })} disabled={categories.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            + Add item
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: "all" as const, name: "All" }, ...categories].map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                  filter === c.id ? "bg-emerald-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            {categories.length === 0 ? "Create a category first, then add items." : "No items here yet."}
          </p>
        )}

        <ul className="space-y-3">
          {visible.map((item) => {
            const src = imageUrl(item.imageUrl);
            return (
              <li key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.categoryName}</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatPrice(item.price)}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <button onClick={() => toggleAvailable(item)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"
                      }`}>
                      {item.isAvailable ? "In stock" : "Out of stock"}
                    </button>
                    <button onClick={() => setModal({ item })} className="text-gray-600 hover:text-emerald-700">Edit</button>
                    <button onClick={() => deleteItem(item)} className="text-gray-600 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {modal && (
        <ItemFormModal
          item={modal.item}
          categories={categories}
          defaultCategoryId={typeof filter === "number" ? filter : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}