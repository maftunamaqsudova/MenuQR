import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice, formatTime } from "@/lib/format";

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  New: { status: "Preparing", label: "Start preparing" },
  Preparing: { status: "Ready", label: "Mark ready" },
  Ready: { status: "Served", label: "Mark served" },
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  New: "bg-amber-100 text-amber-800",
  Preparing: "bg-blue-100 text-blue-800",
  Ready: "bg-emerald-100 text-emerald-800",
  Served: "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-700",
};

type Props = {
  order: Order;
  busy?: boolean;
  onStatus?: (order: Order, status: OrderStatus) => void; // omit for read-only (history)
};

export default function OrderCard({ order, busy, onStatus }: Props) {
  const next = NEXT[order.status];
  const canCancel = order.status === "New" || order.status === "Preparing" || order.status === "Ready";

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {order.tableNumber ? `Table ${order.tableNumber}` : "No table"}{" "}
            <span className="font-normal text-gray-400">#{order.id}</span>
          </p>
          <p className="text-sm text-gray-600">{order.customerName}</p>
          <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status]}`}>
          {order.status}
        </span>
      </div>

      <ul className="space-y-1 text-sm">
        {order.items.map((i) => (
          <li key={i.id}>
            <span className="font-medium">{i.quantity}×</span> {i.name}
            {i.note && <span className="block pl-5 text-xs text-amber-700">Note: {i.note}</span>}
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Order note: {order.note}</p>
      )}

      <p className="text-sm font-semibold text-emerald-700">{formatPrice(order.totalPrice)}</p>

      {onStatus && (next || canCancel) && (
        <div className="flex gap-2">
          {next && (
            <button disabled={busy} onClick={() => onStatus(order, next.status)}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {next.label}
            </button>
          )}
          {canCancel && (
            <button disabled={busy}
              onClick={() => {
                if (confirm(`Cancel order #${order.id}?`)) onStatus(order, "Cancelled");
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-red-300 hover:text-red-600 disabled:opacity-60">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}