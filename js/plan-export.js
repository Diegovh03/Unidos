import {
  DIEGO_PERU_FIN,
  DIEGO_PERU_INICIO,
  VERSE_ESPAÑA,
  formatDate,
  parseDate,
} from "./plan.js";

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function downloadPlanJpg() {
  const w = 1080;
  const h = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0F0F1B");
  bg.addColorStop(0.55, "#1a1228");
  bg.addColorStop(1, "#0F0F1B");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255, 77, 141, 0.18)";
  ctx.beginPath();
  ctx.arc(900, 120, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(107, 91, 255, 0.14)";
  ctx.beginPath();
  ctx.arc(80, 1280, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0f0f5";
  ctx.font = "700 54px Inter, system-ui, sans-serif";
  ctx.fillText("Unidos", 80, 160);
  ctx.fillStyle = "#ff6ba3";
  ctx.font = "500 28px Inter, system-ui, sans-serif";
  ctx.fillText("Nuestro plan", 80, 210);

  const rows = [
    { color: "#8ab4f8", emoji: "✈️", title: "Diego → Gotemburgo", date: "30 de agosto de 2026" },
    { color: "#ba82ff", emoji: "✈️", title: "Bianka → España", date: "30 de octubre de 2026" },
    { color: "#ff6ba3", emoji: "💕", title: "Nos vemos en España", date: formatDate(parseDate(VERSE_ESPAÑA)) },
    {
      color: "#7ee8df",
      emoji: "✈️",
      title: "Diego vuelve a Perú",
      date: `${formatDate(parseDate(DIEGO_PERU_INICIO))} – ${formatDate(parseDate(DIEGO_PERU_FIN))}`,
    },
  ];

  rows.forEach((row, i) => {
    const y = 280 + i * 230;
    roundRect(ctx, 70, y, w - 140, 190, 28);
    ctx.fillStyle = "rgba(26, 26, 46, 0.92)";
    ctx.fill();
    ctx.strokeStyle = row.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(70, y + 28);
    ctx.lineTo(70, y + 162);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(row.emoji, 110, y + 80);
    ctx.fillStyle = "#f0f0f5";
    ctx.font = "700 36px Inter, system-ui, sans-serif";
    ctx.fillText(row.title, 180, y + 78);
    ctx.fillStyle = row.color;
    ctx.font = "500 28px Inter, system-ui, sans-serif";
    ctx.fillText(row.date, 180, y + 130);
  });

  ctx.fillStyle = "#8b8ba3";
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillText("Lima  ↔  Gotemburgo", 80, 1360);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nuestro-plan.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, "image/jpeg", 0.92);
}
