"use client";

import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { API_URL, tokenStore } from "./api";
import type { Order } from "./types";

type Handlers = {
  onCreated: (o: Order) => void;
  onUpdated: (o: Order) => void;
  onReconnected: () => void;
};

export function useOrdersHub(handlers: Handlers) {
  // Always call the latest handlers without reconnecting
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
  .withUrl("http://localhost:5107/hubs/orders", {
      accessTokenFactory: () => tokenStore.get() ?? "",
  })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on("OrderCreated", (o: Order) => ref.current.onCreated(o));
    conn.on("OrderUpdated", (o: Order) => ref.current.onUpdated(o));
    conn.onreconnecting(() => setConnected(false));
    conn.onreconnected(() => {
      setConnected(true);
      ref.current.onReconnected(); // we may have missed orders while offline
    });
    conn.onclose(() => setConnected(false));

    let stopped = false;
    (async () => {
      while (!stopped) {
        try {
          await conn.start();
          if (!stopped) setConnected(true);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();

    return () => {
      stopped = true;
      void conn.stop();
    };
  }, []);

  return connected;
}