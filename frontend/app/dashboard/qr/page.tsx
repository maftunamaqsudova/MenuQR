"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/format";
import { buildLink, makePdf, qrDataUrl, qrSvg, saveFile, saveSvg, type Card } from "@/lib/qr";

// Same rule as the backend: letters, numbers, spaces and dashes, up to 20 characters
const TABLE_RE = /^[\p{L}\p{N}\s-]{0,20}$/u;
const MAX_TABLES = 100;

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const btnClass =
  "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50";

export default function QrPage() {
  const { user } = useAuth();

  const [defaultLink, setDefaultLink] = useState("");
  const [link, setLink] = useState("");
  const [table, setTable] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("10");

  // Default link = this site's address + the restaurant's public path
  useEffect(() => {
    if (!user) return;
    const d = `${window.location.origin}/r/${user.restaurantSlug}`;
    setDefaultLink(d);
    setLink((cur) => cur || d);
  }, [user]);

  const finalLink = buildLink(link, table.trim());

  // Live preview
  useEffect(() => {
    if (!finalLink) return;
    let cancelled = false;
    qrDataUrl(finalLink, 600)
      .then((u) => {
        if (!cancelled) setPreview(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [finalLink]);

  if (!user) return null;

  const slug = user.restaurantSlug;
  const title = user.restaurantName;
  const tableClean = table.trim();
  const baseName = `qr-${slug}${tableClean ? `-table-${tableClean.replace(/\s+/g, "-")}` : ""}`;

  const isLocal = !!finalLink && /^(localhost|127\.0\.0\.1)$/.test(new URL(finalLink).hostname);

  async function run(name: string, fn: () => Promise<void>) {
    setError("");
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  }

  const downloadPng = () =>
    run("png", async () => saveFile(await qrDataUrl(finalLink!, 1024), `${baseName}.png`));

  const downloadSvg = () =>
    run("svg", async () => saveSvg(await qrSvg(finalLink!), `${baseName}.svg`));

  const downloadPdf = () =>
    run("pdf", () =>
      makePdf(
        [{ link: finalLink!, title, tableLabel: tableClean ? `Table ${tableClean}` : undefined }],
        `${baseName}.pdf`
      )
    );

  // ----- one QR per table -----
  const a = Number(from);
  const b = Number(to);
  const rangeOk = Number.isInteger(a) && Number.isInteger(b) && a >= 1 && b >= a && b - a + 1 <= MAX_TABLES;
  const baseOk = !!buildLink(link);

  const downloadAll = () =>
    run("all", async () => {
      const cards: Card[] = [];
      for (let i = a; i <= b; i++) {
        cards.push({ link: buildLink(link, String(i))!, title, tableLabel: `Table ${i}` });
      }
      await makePdf(cards, `qr-${slug}-tables-${a}-${b}.pdf`);
    });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR code</h1>
        <p className="text-sm text-gray-500">
          Guests scan the code and land on your menu. Print it and put it on the tables.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ---------- single QR ---------- */}
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Create a QR code</h2>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Link</span>
          <input className={inputClass} inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} />
          {defaultLink && link !== defaultLink && (
            <button type="button" onClick={() => setLink(defaultLink)}
              className="mt-1 text-xs text-emerald-700 hover:underline">
              Reset to my restaurant page
            </button>
          )}
        </label>

        {!finalLink && (
          <p className="text-sm text-red-600">Enter a full link starting with http:// or https://</p>
        )}

        {isLocal && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This link points to <b>localhost</b>, which only works on this computer. A phone cannot open it.
            That is fine for testing. Before printing, use your real website address.
          </p>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Table number (optional)</span>
          <input className={inputClass} placeholder="e.g. 5" value={table}
            onChange={(e) => TABLE_RE.test(e.target.value) && setTable(e.target.value)} />
        </label>

        {finalLink && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="QR code preview" className="h-56 w-56 bg-white" />
            )}
            <p className="break-all text-center text-xs text-gray-500">{finalLink}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className={btnClass} disabled={!finalLink || !!busy} onClick={downloadPng}>
            {busy === "png" ? "Preparing..." : "Download PNG"}
          </button>
          <button className={btnClass} disabled={!finalLink || !!busy} onClick={downloadSvg}>
            {busy === "svg" ? "Preparing..." : "Download SVG"}
          </button>
          <button className={btnClass} disabled={!finalLink || !!busy} onClick={downloadPdf}>
            {busy === "pdf" ? "Preparing..." : "Printable PDF"}
          </button>
        </div>
      </section>

      {/* ---------- all tables ---------- */}
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">A QR code for every table</h2>
          <p className="text-sm text-gray-500">
            One PDF page per table (&quot;Table 1&quot;, &quot;Table 2&quot;...). Each code opens the menu with the table
            number already filled in, so guests do not have to type it.
          </p>
        </div>

        <div className="flex items-end gap-3">
          <label className="block w-28">
            <span className="mb-1 block text-sm font-medium text-gray-700">From table</span>
            <input type="number" min={1} className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block w-28">
            <span className="mb-1 block text-sm font-medium text-gray-700">To table</span>
            <input type="number" min={1} className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        {!rangeOk && (
          <p className="text-sm text-red-600">
            Enter whole numbers, starting from 1, with at most {MAX_TABLES} tables.
          </p>
        )}

        <button className={btnClass} disabled={!rangeOk || !baseOk || !!busy} onClick={downloadAll}>
          {busy === "all" ? "Creating PDF..." : `Download PDF (${rangeOk ? b - a + 1 : 0} pages)`}
        </button>
      </section>
    </div>
  );
}