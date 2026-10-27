"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { playBeep, unlockAudio } from "@/lib/sound";
import { useOrdersHub } from "@/lib/useOrdersHub";
import type { Order, OrderStatus, PagedResult } from "@/lib/types";
import OrderCard, { STATUS_STYLE } from "@/components/OrderCard";

const SOUND_KEY = "qrmenu_sound";
const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "New", title: "New" },
  { status: "Preparing", title: "Preparing" },
  { status: "Ready", title: "Ready" },
];

export default function OrdersPage() {
  const [tab, setTab] = useState<"live" | "history">("live");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="mr-3 text-2xl font-bold">Orders</h1>
        {(["live", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t ? "bg-emerald-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
            }`}>
            {t === "live" ? "Live" : "History"}
          </button>
        ))}
      </div>

      {tab === "live" ? <LiveOrders /> : <OrderHistory />}
    </div>
  );
}

/* ------------------------------ LIVE ------------------------------ */

function LiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_KEY) === "1");
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api<PagedResult<Order>>("/orders?active=true&page=1&pageSize=100");
      setOrders(res.items);
      setError("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connected = useOrdersHub({
    onCreated: (order) => {
      setOrders((list) => (list.some((o) => o.id === order.id) ? list : [...list, order]));
      if (soundOn) playBeep();
    },
    onUpdated: (order) => {
      setOrders((list) => {
        const finished = order.status === "Served" || order.status === "Cancelled";
        if (finished) return list.filter((o) => o.id !== order.id);
        return list.some((o) => o.id === order.id)
          ? list.map((o) => (o.id === order.id ? order : o))
          : [...list, order];
      });
    },
    onReconnected: load,
  });

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    if (next) {
      unlockAudio();
      playBeep(); // test beep
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    setError("");
    try {
      const updated = await api<Order>(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((list) =>
        status === "Served" || status === "Cancelled"
          ? list.filter((o) => o.id !== updated.id)
          : list.map((o) => (o.id === updated.id ? updated : o))
      );
    } catch (e) {
      setError(errMsg(e));
      load(); // the order may have been changed from another device
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={`flex items-center gap-1.5 ${connected ? "text-emerald-700" : "text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
          {connected ? "Live" : "Connecting..."}
        </span>
        <button onClick={toggleSound}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100">
          {soundOn ? "🔔 Sound on" : "🔕 Sound off"}
        </button>
        <span className="text-gray-400">
          Click the sound button once after opening this page, otherwise the browser blocks the sound.
        </span>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {orders.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          No active orders. New orders will appear here instantly.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[col.status]}`}>{col.title}</span>
                <span className="text-sm text-gray-400">{list.length}</span>
              </h2>
              {list.map((o) => (
                <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={changeStatus} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- HISTORY ----------------------------- */

function OrderHistory() {
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [data, setData] = useState<PagedResult<Order> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q = `/orders?page=${page}&pageSize=${PAGE_SIZE}` + (status === "all" ? "" : `&status=${status}`);
    api<PagedResult<Order>>(q)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filters: (OrderStatus | "all")[] = ["all", "New", "Preparing", "Ready", "Served", "Cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f}
            onClick={() => {
              setStatus(f);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              status === f ? "bg-emerald-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
            }`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && data && data.items.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">No orders found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">
            ← Previous
          </button>
          <span className="text-gray-600">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}