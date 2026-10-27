"use client";

import { FormEvent, useEffect, useState } from "react";
import { errMsg, formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { CartLine } from "@/lib/useCart";
import QtyStepper from "./QtyStepper";

const NAME_KEY = "qrmenu_customer_name";

type Details = { customerName: string; tableNumber: string; note: string };

type Props = {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  total: number;
  tableFromQr: string;
  onQty: (id: number, qty: number) => void;
  onNote: (id: number, note: string) => void;
  onPlace: (details: Details) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function CartSheet({
  open, onClose, lines, total, tableFromQr, onQty, onNote, onPlace,
}: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [table, setTable] = useState(tableFromQr);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (tableFromQr) setTable(tableFromQr);
  }, [tableFromQr]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      await onPlace({ customerName: name, tableNumber: table, note });
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* ignore */
      }
      setNote("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-lg font-bold">{t("cartTitle")}</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            {t("close")}
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {lines.length === 0 && <p className="text-gray-500">{t("cartEmpty")}</p>}

          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="space-y-2 rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(l.price)}</p>
                  </div>
                  <QtyStepper qty={l.quantity} onChange={(q) => onQty(l.id, q)} />
                </div>
                <input value={l.note} maxLength={300} placeholder={t("notePlaceholder")}
                  onChange={(e) => onNote(l.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-600" />
                <p className="text-right text-sm font-semibold">{formatPrice(l.price * l.quantity)}</p>
              </li>
            ))}
          </ul>

          {lines.length > 0 && (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t("yourName")}</span>
                <input required maxLength={60} autoComplete="given-name" className={inputClass}
                  value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t("tableNumber")}</span>
                <input required maxLength={20} className={inputClass} value={table}
                  readOnly={!!tableFromQr}
                  onChange={(e) => setTable(e.target.value)} />
                {tableFromQr && (
                  <span className="mt-1 block text-xs text-gray-400">{t("tableFromQr")}</span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t("orderNote")}</span>
                <textarea rows={2} maxLength={500} className={inputClass}
                  value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-gray-600">{t("total")}</span>
            <span className="text-lg font-bold">{formatPrice(total)}</span>
          </div>
          <button type="submit" disabled={submitting || lines.length === 0}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {submitting ? t("sending") : t("placeOrder")}
          </button>
        </div>
      </form>
    </div>
  );
}