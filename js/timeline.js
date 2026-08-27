import { cloudGet, formatDateShort, formatText, PERSONAS, loadPhoto } from "./cloud.js";
import { loadVideo } from "./media.js";

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
 * Feed unificado: pensamientos (diario) + fotos + videos (recuerdos)
 */
export async function buildUnifiedFeed(filter = "todo") {
  const { loadRecuerdos, getRecuerdosSnapshot } = await import("./pages/recuerdos.js");
  await loadRecuerdos();
  const diario = await loadDiarioEntries();
  const fotos = getRecuerdosSnapshot();

  const items = [];

  for (const e of diario) {
    items.push({
      id: e.id,
      source: "diario",
      type: "pensamiento",
      date: e.date,
      by: e.by,
      text: e.text || "",
      photoId: e.photoId || null,
      videoId: e.videoId || null,
      title: null,
      albumId: null,
    });
  }

  for (const f of fotos) {
    const isVideo = f.mediaType === "video";
    items.push({
      id: f.id,
      source: "recuerdos",
      type: isVideo ? "video" : "foto",
      date: f.date,
      by: f.by,
      text: null,
      photoId: isVideo ? null : f.id,
      videoId: isVideo ? f.id : null,
      title: f.title,
      albumId: f.albumId,
    });
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filter === "fotos") return items.filter((i) => i.type === "foto");
  if (filter === "videos") return items.filter((i) => i.type === "video");
  if (filter === "pensamientos") return items.filter((i) => i.type === "pensamiento");
  return items;
}

export async function hydrateFeedMedia(item) {
  if (item.videoId) {
    const src = await loadVideo(item.videoId);
    return { ...item, mediaSrc: src, mediaKind: "video" };
  }
  if (item.photoId) {
    const src = await loadPhoto(item.photoId);
    return { ...item, mediaSrc: src, mediaKind: "photo" };
  }
  return { ...item, mediaSrc: null, mediaKind: null };
}

export function feedTypeLabel(type) {
  const map = {
    pensamiento: "💭 Pensamiento",
    foto: "📷 Foto",
    video: "🎬 Video",
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
