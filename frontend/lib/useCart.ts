"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicMenuItem } from "./types";

export type CartLine = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note: string;
};

function isLine(x: unknown): x is CartLine {
  const l = x as CartLine;
  return (
    !!l &&
    typeof l.id === "number" &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    typeof l.quantity === "number" &&
    typeof l.note === "string"
  );
}

export function useCart(slug: string) {
  const key = `qrmenu_cart_${slug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Load the saved cart once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setLines(parsed.filter(isLine));
    } catch {
      /* ignore broken saved data */
    }
    setReady(true);
  }, [key]);

  // Save on every change
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(lines));
    } catch {
      /* storage may be blocked (private mode) */
    }
  }, [lines, ready, key]);

  const add = useCallback((item: PublicMenuItem) => {
    setLines((prev) =>
      prev.some((l) => l.id === item.id)
        ? prev.map((l) =>
            l.id === item.id ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l
          )
        : [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, note: "" }]
    );
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, quantity: Math.min(99, qty) } : l))
    );
  }, []);

  const setNote = useCallback((id: number, note: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, note } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  // Compare the cart with the latest menu: drop items that were removed or
  // went out of stock, and refresh names and prices.
  const sync = useCallback((items: PublicMenuItem[]) => {
    const byId = new Map(items.map((i) => [i.id, i]));
    setLines((prev) =>
      prev.flatMap((l) => {
        const m = byId.get(l.id);
        return m && m.isAvailable ? [{ ...l, name: m.name, price: m.price }] : [];
      })
    );
  }, []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.price, 0), [lines]);

  return { lines, ready, count, total, add, setQty, setNote, clear, sync };
}