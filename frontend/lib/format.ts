export function formatPrice(n: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(n)} UZS`;
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

// Server dates are UTC. Some arrive without a "Z", so we add it.
export function parseUtc(s: string): Date {
  return new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(s) ? s : s + "Z");
}

export function formatTime(s: string): string {
  return parseUtc(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}