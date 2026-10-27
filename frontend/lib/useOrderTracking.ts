"use client";

import { useEffect, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { API_URL, ApiError, api } from "./api";
import type { OrderStatus, PublicOrder } from "./types";

export function useOrderTracking(publicId: string | null) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [goneId, setGoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    let stopped = false;

    const refresh = async () => {
      try {
        const o = await api<PublicOrder>(`/public/orders/${publicId}`);
        if (!stopped) setOrder(o);
      } catch (e) {
        if (!stopped && e instanceof ApiError && e.status === 404) setGoneId(publicId);
      }
    };
    void refresh();

    // Customers are not logged in, so no token is sent
    const conn = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/orders`)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.None)
      .build();

    conn.on("OrderStatusChanged", (p: { publicId: string; status: OrderStatus }) => {
      if (p.publicId.toLowerCase() !== publicId.toLowerCase()) return;
      setOrder((o) => (o ? { ...o, status: p.status } : o));
    });

    const join = () => conn.invoke("JoinOrder", publicId).catch(() => {});
    conn.onreconnected(() => {
      void join(); // groups are lost after a reconnect, so join again
      void refresh();
    });
    conn.start().then(join).catch(() => {});

    const poll = setInterval(refresh, 15000);

    return () => {
      stopped = true;
      clearInterval(poll);
      void conn.stop();
    };
  }, [publicId]);

  const current =
    order && publicId && order.publicId.toLowerCase() === publicId.toLowerCase() ? order : null;

  return { order: current, gone: !!publicId && goneId === publicId };
}