import { cloudGet, formatDateShort, formatText, PERSONAS } from "./cloud.js";

async function loadDiarioEntries() {
  const remote = await cloudGet("diario");
  if (Array.isArray(remote)) return remote;
  try {
    const local = localStorage.getItem("diario-cache");
    if (local) return JSON.parse(local);
  } catch { /* ignore */ }
  return [];
}

/**
 * Feed unificado: pensamientos (diario) + fotos de Nuestro Espacio
 */
export async function buildUnifiedFeed(filter = "todo") {
  const { getMomentosTodos } = await import("./supabase-diario.js");
  const diario = await loadDiarioEntries();
  const fotos = await getMomentosTodos(500);

  const items = [];

  for (const e of diario) {
    items.push({
      id: e.id,
      source: "diario",
      type: "pensamiento",
      date: e.date,
      by: e.by,
      text: e.text || "",
      photoUrl: null,
    });
  }

  for (const f of fotos) {
    items.push({
      id: `${f.date}-${f.persona}`,
      source: "recuerdos",
      type: "foto",
      date: f.date,
      by: f.persona,
      text: f.caption || "",
      photoUrl: f.foto_url,
    });
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filter === "fotos") return items.filter((i) => i.type === "foto");
  if (filter === "pensamientos") return items.filter((i) => i.type === "pensamiento");
  return items;
}

export function feedTypeLabel(type) {
  const map = {
    pensamiento: "💭 Pensamiento",
    foto: "📷 Foto",
  };
  return map[type] || "";
}

export function formatFeedDate(iso) {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export { formatDateShort, formatText, PERSONAS };
