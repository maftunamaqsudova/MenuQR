import QRCode from "qrcode";

// Returns the final link (with ?table=5 if a table is given), or null if the link is invalid
export function buildLink(base: string, table?: string): string | null {
  try {
    const url = new URL(base.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (table) url.searchParams.set("table", table);
    return url.toString();
  } catch {
    return null;
  }
}

export function qrDataUrl(text: string, width = 1024): Promise<string> {
  return QRCode.toDataURL(text, { width, margin: 2, errorCorrectionLevel: "M" });
}

export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
}

export function saveFile(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function saveSvg(svg: string, filename: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  saveFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not draw the QR code."));
    img.src = src;
  });
}

export type Card = { link: string; title: string; tableLabel?: string };

// Draws one A4 page (150 dpi): restaurant name, QR code, table number
async function drawCard(card: Card): Promise<HTMLCanvasElement> {
  const W = 1240;
  const H = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot create the PDF.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Restaurant name, shrunk until it fits
  let size = 84;
  ctx.fillStyle = "#111827";
  do {
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    size -= 4;
  } while (ctx.measureText(card.title).width > W - 160 && size > 28);
  ctx.fillText(card.title, W / 2, 250);

  ctx.fillStyle = "#6b7280";
  ctx.font = "44px Arial, Helvetica, sans-serif";
  ctx.fillText("Scan to view the menu and order", W / 2, 340);

  const qr = await loadImage(await qrDataUrl(card.link, 900));
  ctx.drawImage(qr, (W - 900) / 2, 420, 900, 900);

  if (card.tableLabel) {
    ctx.fillStyle = "#047857";
    ctx.font = "bold 150px Arial, Helvetica, sans-serif";
    ctx.fillText(card.tableLabel, W / 2, 1560);
  }

  return canvas;
}

// One A4 page per card
export async function makePdf(cards: Card[], filename: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  for (let i = 0; i < cards.length; i++) {
    const canvas = await drawCard(cards[i]);
    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
  }

  pdf.save(filename);
}