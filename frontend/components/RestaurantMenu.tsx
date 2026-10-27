"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError, imageUrl } from "@/lib/api";
import { errMsg, formatPrice } from "@/lib/format";
import { TKey, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/useCart";
import { useOrderTracking } from "@/lib/useOrderTracking";
import type { PublicMenu, PublicMenuItem, PublicOrder } from "@/lib/types";
import CartSheet from "./CartSheet";
import LanguageSwitcher from "./LanguageSwitcher";
import OrderTracker from "./OrderTracker";
import QtyStepper from "./QtyStepper";

export default function RestaurantMenu({ slug: rawSlug }: { slug: string }) {
  const { t } = useI18n();
  const slug = rawSlug.toLowerCase();
  const orderKey = `qrmenu_order_${slug}`;

  const search = useSearchParams();
  const tableFromQr = (search.get("table") ?? "").trim().slice(0, 20);

  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const cart = useCart(slug);
  const [cartOpen, setCartOpen] = useState(false);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [view, setView] = useState<"menu" | "order">("menu");
  const { order, gone } = useOrderTracking(orderId);

  const [active, setActive] = useState<number | null>(null);

  const loadMenu = useCallback(async () => {
    try {
      const data = await api<PublicMenu>(`/public/restaurants/${encodeURIComponent(slug)}`);
      setMenu(data);
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else setError(errMsg(e));
    }
  }, [slug]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    if (menu && cart.ready) cart.sync(menu.categories.flatMap((c) => c.items));
  }, [menu, cart.ready, cart.sync]);

  useEffect(() => {
    try {
      setOrderId(localStorage.getItem(orderKey));
    } catch {
      /* ignore */
    }
  }, [orderKey]);

  const dismissOrder = useCallback(() => {
    try {
      localStorage.removeItem(orderKey);
    } catch {
      /* ignore */
    }
    setOrderId(null);
    setView("menu");
  }, [orderKey]);

  const finished = order?.status === "Served" || order?.status === "Cancelled";

  useEffect(() => {
    if (gone) dismissOrder();
  }, [gone, dismissOrder]);

  useEffect(() => {
    if (finished && view === "menu") dismissOrder();
  }, [finished, view, dismissOrder]);

  useEffect(() => {
    if (!menu) return;
    const els = menu.categories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(Number(visible[0].target.id.replace("cat-", "")));
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [menu, view]);

  const qtyById = useMemo(() => new Map(cart.lines.map((l) => [l.id, l.quantity])), [cart.lines]);

  async function placeOrder(d: { customerName: string; tableNumber: string; note: string }) {
    try {
      const res = await api<PublicOrder>(`/public/restaurants/${encodeURIComponent(slug)}/orders`, {
        method: "POST",
        body: JSON.stringify({
          customerName: d.customerName.trim(),
          tableNumber: d.tableNumber.trim() || null,
          note: d.note.trim() || null,
          items: cart.lines.map((l) => ({
            menuItemId: l.id,
            quantity: l.quantity,
            note: l.note.trim() || null,
          })),
        }),
      });

      cart.clear();
      try {
        localStorage.setItem(orderKey, res.publicId);
      } catch {
        /* ignore */
      }
      setOrderId(res.publicId);
      setView("order");
      setCartOpen(false);
    } catch (e) {
      void loadMenu();
      throw e;
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="text-gray-500">{t("notFoundText")}</p>
      </main>
    );
  }

  if (!menu) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        {error || t("loadingMenu")}
      </div>
    );
  }

  if (view === "order") {
    return <OrderTracker order={order} onBack={() => setView("menu")} onFinish={dismissOrder} />;
  }

  const r = menu.restaurant;
  const cover = imageUrl(r.coverImageUrl);
  const logo = imageUrl(r.logoUrl);

  function scrollTo(id: number) {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pb-28">
      <div className="relative h-40 bg-emerald-700 sm:h-52">
        <LanguageSwitcher className="absolute right-3 top-3 z-10" />
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <div className="-mt-10 flex items-end gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h1 className="text-2xl font-bold">{r.name}</h1>
          {r.description && <p className="text-gray-600">{r.description}</p>}
          <p className="text-sm text-gray-500">
            {r.address}
            {r.address && r.phone && " · "}
            {r.phone && (
              <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="text-emerald-700">{r.phone}</a>
            )}
          </p>
          {tableFromQr && (
            <p className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              {t("table")} {tableFromQr}
            </p>
          )}
        </div>

        {orderId && order && !finished && (
          <button onClick={() => setView("order")}
            className="mt-4 flex w-full items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <span>{t("yourOrder")}: <b>{t(`status_${order.status}` as TKey)}</b></span>
            <span className="font-medium underline">{t("track")}</span>
          </button>
        )}
      </div>

      {menu.categories.length > 0 && (
        <nav className="sticky top-0 z-20 mt-4 border-y border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2">
            {menu.categories.map((c) => (
              <button key={c.id} onClick={() => scrollTo(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                  active === c.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-6">
        {menu.categories.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">{t("menuEmpty")}</p>
        )}

        {menu.categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-16">
            <h2 className="mb-3 text-xl font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {c.items.map((item) => (
                <ItemRow key={item.id} item={item} qty={qtyById.get(item.id) ?? 0}
                  onAdd={() => cart.add(item)} onQty={(q) => cart.setQty(item.id, q)} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {cart.count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <button onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white shadow-lg hover:bg-emerald-700">
            <span>{t("viewOrder")} · {cart.count}</span>
            <span>{formatPrice(cart.total)}</span>
          </button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        total={cart.total}
        tableFromQr={tableFromQr}
        onQty={cart.setQty}
        onNote={cart.setNote}
        onPlace={placeOrder}
      />
    </div>
  );
}

function ItemRow({
  item, qty, onAdd, onQty,
}: {
  item: PublicMenuItem;
  qty: number;
  onAdd: () => void;
  onQty: (qty: number) => void;
}) {
  const { t } = useI18n();
  const src = imageUrl(item.imageUrl);
  const out = !item.isAvailable;

  return (
    <li className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ${out ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 line-clamp-3 text-sm text-gray-500">{item.description}</p>
        )}
        <p className="mt-1 font-semibold text-emerald-700">{formatPrice(item.price)}</p>

        <div className="mt-2">
          {out ? (
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">{t("outOfStock")}</span>
          ) : qty === 0 ? (
            <button onClick={onAdd}
              className="rounded-full border border-emerald-600 px-4 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
              {t("add")}
            </button>
          ) : (
            <QtyStepper qty={qty} onChange={onQty} />
          )}
        </div>
      </div>

      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
      )}
    </li>
  );
}