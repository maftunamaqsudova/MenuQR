"use client";

import { formatPrice, formatTime } from "@/lib/format";
import { TKey, useI18n } from "@/lib/i18n";
import type { OrderStatus, PublicOrder } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";

const STEPS: { status: OrderStatus; label: TKey }[] = [
  { status: "New", label: "stepSent" },
  { status: "Preparing", label: "stepPreparing" },
  { status: "Ready", label: "stepReady" },
  { status: "Served", label: "stepServed" },
];

const MESSAGE: Record<OrderStatus, TKey> = {
  New: "msgNew",
  Preparing: "msgPreparing",
  Ready: "msgReady",
  Served: "msgServed",
  Cancelled: "msgCancelled",
};

type Props = {
  order: PublicOrder | null;
  onBack: () => void;
  onFinish: () => void;
};

export default function OrderTracker({ order, onBack, onFinish }: Props) {
  const { t } = useI18n();

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        {t("loadingOrder")}
      </div>
    );
  }

  const finished = order.status === "Served" || order.status === "Cancelled";
  const cancelled = order.status === "Cancelled";
  const stepIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-5 p-4">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">{order.restaurantName}</p>
        <h1 className="text-2xl font-bold">{cancelled ? t("orderCancelled") : t("orderPlaced")}</h1>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        {!cancelled && (
          <ol className="flex items-center">
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              return (
                <li key={s.status} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-center">
                    <div className={`h-1 flex-1 ${i === 0 ? "bg-transparent" : i <= stepIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={`h-1 flex-1 ${i === STEPS.length - 1 ? "bg-transparent" : i < stepIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
                  </div>
                  <span className={`text-center text-xs ${done ? "font-medium text-emerald-700" : "text-gray-400"}`}>
                    {t(s.label)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <p className={`rounded-lg p-3 text-center text-sm font-medium ${
          cancelled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
        }`}>
          {t(MESSAGE[order.status])}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{order.customerName}{order.tableNumber ? ` · ${t("table")} ${order.tableNumber}` : ""}</span>
          <span>{formatTime(order.createdAt)}</span>
        </div>

        <ul className="space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>
                <span className="font-medium">{i.quantity}×</span> {i.name}
                {i.note && <span className="block pl-5 text-xs text-amber-700">{t("note")}: {i.note}</span>}
              </span>
              <span className="shrink-0 text-gray-600">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>

        {order.note && (
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{t("orderNoteLabel")}: {order.note}</p>
        )}

        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
          <span>{t("total")}</span>
          <span>{formatPrice(order.totalPrice)}</span>
        </div>
      </div>

      <button onClick={finished ? onFinish : onBack}
        className="w-full rounded-xl border border-gray-300 bg-white py-3 font-medium hover:bg-gray-100">
        {finished ? t("backToMenu") : t("orderMore")}
      </button>
    </main>
  );
}