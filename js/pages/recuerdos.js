import {
  cloudGet,
  cloudSet,
  compressImage,
  escapeHtml,
  formatDateShort,
  getYo,
  uid,
  PERSONAS,
  loadPhoto,
  savePhoto,
  deletePhoto,
  photoToBytes,
} from "../cloud.js";
import { saveVideo, deleteVideo, isVideoFile, MAX_VIDEO_BYTES, loadVideo } from "../media.js";
import {
  buildUnifiedFeed,
  feedTypeLabel,
  formatFeedDate,
  formatText,
} from "../timeline.js";
import { buildZip, downloadBytes } from "../zip.js";

const DEFAULT_ALBUMS = [
  { id: "juntos", name: "Nuestros momentos", type: "juntos", emoji: "💕" },
  { id: "lima", name: "Lima", type: "ciudad", emoji: "🇵🇪" },
  { id: "gotemburgo", name: "Gotemburgo", type: "ciudad", emoji: "🇸🇪" },
  { id: "diego", name: "Diego", type: "diego", emoji: "🐶" },
  { id: "bianka", name: "Bianka", type: "bianka", emoji: "🐱" },
];

let data = { albums: [...DEFAULT_ALBUMS], fotos: [] };
let filter = "todo";
let selectedAlbum = null;
let yearFilter = "2026";
let monthFilter = "all";

const MES_NOM = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function mesesDelEspacio(year) {
  const years = year === "todo" ? ["2026", "2027"] : [year];
  const out = [];
  for (const y of years) {
    const start = y === "2026" ? 6 : 1;
    for (let m = start; m <= 12; m++) {
      out.push({
        year: y,
        month: String(m).padStart(2, "0"),
        key: `${y}-${String(m).padStart(2, "0")}`,
        label: year === "todo" ? `${MES_NOM[m - 1]} ${y.slice(2)}` : MES_NOM[m - 1],
      });
    }
  }
  return out;
}

function inEspacioRange(iso) {
  const key = String(iso || "").slice(0, 7);
  return key >= "2026-06" && key <= "2027-12";
}

export async function loadRecuerdos() {
  data = { albums: [...DEFAULT_ALBUMS], fotos: [] };

  const local = localStorage.getItem("recuerdos-cache");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.albums?.length) data.albums = parsed.albums;
      if (parsed.fotos?.length) data.fotos = parsed.fotos;
    } catch { /* ignore */ }
  }

  const remote = await cloudGet("recuerdos");
  if (remote) {
    if (remote.albums?.length) data.albums = remote.albums;
    if (remote.fotos?.length) {
      const byId = new Map(data.fotos.map((f) => [f.id, f]));
      for (const f of remote.fotos) byId.set(f.id, f);
      data.fotos = [...byId.values()];
    }
  }

  for (const album of DEFAULT_ALBUMS) {
    if (!data.albums.some((a) => a.id === album.id)) {
      data.albums.push(album);
    }
  }
}

export function getRecuerdosSnapshot() {
  return [...data.fotos];
}

export async function getAlbumFotos(albumId) {
  await loadRecuerdos();
  const fotos = data.fotos
    .filter((f) => f.albumId === albumId && f.mediaType !== "video")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const result = [];
  for (const f of fotos) {
    const src = await loadPhoto(f.id);
    if (src) result.push({ src, title: f.title || "Recuerdo", id: f.id });
  }
  return result;
}

async function saveRecuerdos() {
  localStorage.setItem("recuerdos-cache", JSON.stringify(data));
  await cloudSet("recuerdos", data);
}

export async function renderRecuerdos(container) {
  await loadRecuerdos();

  container.innerHTML = `
    <div class="espacio-hero anim-in">
      <h2 class="espacio-title">Nuestro espacio 💕</h2>
      <p class="espacio-sub">Junio 2026 → diciembre 2027 · las fotos se guardan en el teléfono (sin tope chiquito)</p>
      <button type="button" class="btn-pink btn-sm" id="export-zip">Descargar fotos (ZIP)</button>
    </div>

    <div class="year-tabs">
      <button type="button" class="filter-tab ${yearFilter === "2026" ? "active" : ""}" data-year="2026">2026</button>
      <button type="button" class="filter-tab ${yearFilter === "2027" ? "active" : ""}" data-year="2027">2027</button>
      <button type="button" class="filter-tab ${yearFilter === "todo" ? "active" : ""}" data-year="todo">Todo</button>
    </div>

    <div class="month-scroll" id="month-row">
      <button type="button" class="album-chip ${monthFilter === "all" ? "active" : ""}" data-month="all">Todos</button>
      ${mesesDelEspacio(yearFilter).map((m) => `
        <button type="button" class="album-chip ${monthFilter === m.key ? "active" : ""}" data-month="${m.key}">${m.label}</button>
      `).join("")}
    </div>

    <div class="filter-tabs">
      <button type="button" class="filter-tab ${filter === "todo" ? "active" : ""}" data-f="todo">Todo</button>
      <button type="button" class="filter-tab ${filter === "fotos" ? "active" : ""}" data-f="fotos">📷 Fotos</button>
      <button type="button" class="filter-tab ${filter === "videos" ? "active" : ""}" data-f="videos">🎬 Videos</button>
      <button type="button" class="filter-tab ${filter === "pensamientos" ? "active" : ""}" data-f="pensamientos">💭 Pensamientos</button>
    </div>

    <div class="albums-scroll ${filter === "pensamientos" ? "hidden" : ""}" id="albums-row">
      ${data.albums.map((a) => `
        <button type="button" class="album-chip ${selectedAlbum === a.id ? "active" : ""}" data-album="${a.id}">
          ${a.emoji} ${a.name}
        </button>`).join("")}
    </div>

    <div class="espacio-feed" id="espacio-feed">
      <p class="loading pulse-dots">Cargando<span>.</span><span>.</span><span>.</span></p>
    </div>

    <button type="button" class="fab" id="espacio-fab">+</button>

    <div class="modal hidden" id="upload-modal">
      <div class="modal-box">
        <h3 id="upload-modal-title">Agregar a nuestro espacio</h3>
        <div class="upload-type-btns">
          <button type="button" class="upload-type-btn" data-upload="media">📷 Foto o video</button>
          <button type="button" class="upload-type-btn" data-upload="pensamiento">💭 Escribir pensamiento</button>
        </div>
        <div class="hidden" id="upload-media-form">
          <select id="upload-album" class="input-field">
            ${data.albums.map((a) => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join("")}
          </select>
          <input type="text" id="upload-title" class="input-field" placeholder="Título o descripción…" maxlength="120" />
          <p class="upload-hint">Videos cortos (máx. ~30 s / 30 MB) se ven mejor en el celular</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="upload-cancel">Cancelar</button>
            <button type="button" class="btn" id="upload-save" disabled>Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <input type="file" accept="image/*,video/*" id="media-input" hidden />
  `;

  bindRecuerdosEvents(container);
  await renderEspacioFeed(container);
}

async function renderEspacioFeed(container) {
  const feedEl = document.getElementById("espacio-feed");
  if (!feedEl) return;

  let items = await buildUnifiedFeed(filter);

  if (selectedAlbum && filter !== "pensamientos") {
    items = items.filter((i) => i.source === "recuerdos" && i.albumId === selectedAlbum);
  }

  if (yearFilter !== "todo") {
    items = items.filter((i) => String(i.date || "").startsWith(yearFilter));
  }
  items = items.filter((i) => inEspacioRange(i.date));
  if (monthFilter !== "all") {
    items = items.filter((i) => String(i.date || "").slice(0, 7) === monthFilter);
  }

  if (!items.length) {
    feedEl.innerHTML = `
      <div class="empty-illustration">
        <span>💕</span>
        <p>Aún vacío — guardad aquí lo que no queréis perder en WhatsApp</p>
        <small>Fotos, videos cortos o pensamientos del diario</small>
      </div>`;
    return;
  }

  feedEl.innerHTML = items.map((item, i) => `
    <article class="espacio-card anim-in ${item.type}" data-id="${item.id}" style="animation-delay:${(i % 8) * 0.05}s">
      <header class="espacio-card-head">
        <span class="espacio-badge">${feedTypeLabel(item.type)}</span>
        <span class="espacio-meta">${PERSONAS[item.by]?.emoji || "💕"} ${formatFeedDate(item.date)}</span>
      </header>
      ${item.title ? `<h3 class="espacio-title-item">${escapeHtml(item.title)}</h3>` : ""}
      ${item.text ? `<p class="espacio-text">${formatText(item.text)}</p>` : ""}
      ${item.photoId ? `<div class="espacio-media" id="media-photo-${item.id}"><span class="photo-placeholder">📷</span></div>` : ""}
      ${item.videoId ? `<div class="espacio-media espacio-video" id="media-video-${item.id}"><span class="photo-placeholder">🎬</span></div>` : ""}
    </article>
  `).join("");

  feedEl.querySelectorAll(".espacio-card").forEach((el) => el.classList.add("anim-play"));

  for (const item of items) {
    if (item.photoId) {
      const el = document.getElementById(`media-photo-${item.id}`);
      const src = await loadPhoto(item.photoId);
      if (el && src) el.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
    }
    if (item.videoId) {
      const el = document.getElementById(`media-video-${item.id}`);
      const src = await loadVideo(item.videoId);
      if (el && src) el.innerHTML = `<video src="${src}" controls playsinline preload="metadata"></video>`;
      else if (el) el.innerHTML = `<span class="photo-error">Video en otro dispositivo</span>`;
    }
  }
}

let pendingFile = null;

function bindRecuerdosEvents(container) {
  container.querySelectorAll("[data-year]").forEach((btn) => {
    btn.addEventListener("click", () => {
      yearFilter = btn.dataset.year;
      monthFilter = "all";
      renderRecuerdos(container);
    });
  });

  container.querySelectorAll("[data-month]").forEach((btn) => {
    btn.addEventListener("click", () => {
      monthFilter = btn.dataset.month;
      renderRecuerdos(container);
    });
  });

  document.getElementById("export-zip")?.addEventListener("click", () => exportEspacioZip());

  container.querySelectorAll(".filter-tab[data-f]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.f;
      selectedAlbum = null;
      renderRecuerdos(container);
    });
  });

  container.querySelectorAll(".album-chip[data-album]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAlbum = selectedAlbum === btn.dataset.album ? null : btn.dataset.album;
      renderEspacioFeed(container);
    });
  });

  document.getElementById("espacio-fab")?.addEventListener("click", () => {
    document.getElementById("upload-modal")?.classList.remove("hidden");
    document.getElementById("upload-media-form")?.classList.add("hidden");
    document.querySelector(".upload-type-btns")?.classList.remove("hidden");
  });

  document.querySelectorAll("[data-upload]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.upload === "pensamiento") {
        document.getElementById("upload-modal")?.classList.add("hidden");
        window.dispatchEvent(new CustomEvent("navigate", { detail: "diario" }));
        return;
      }
      document.querySelector(".upload-type-btns")?.classList.add("hidden");
      document.getElementById("upload-media-form")?.classList.remove("hidden");
      document.getElementById("media-input")?.click();
    });
  });

  document.getElementById("media-input")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFile = file;
    document.getElementById("upload-save").disabled = false;
    e.target.value = "";
  });

  document.getElementById("upload-cancel")?.addEventListener("click", () => {
    pendingFile = null;
    document.getElementById("upload-modal")?.classList.add("hidden");
  });

  document.getElementById("upload-save")?.addEventListener("click", async () => {
    if (!pendingFile) return;
    const yo = getYo() || "diego";
    const id = uid();
    const title = document.getElementById("upload-title").value.trim();
    const albumId = document.getElementById("upload-album").value;

    try {
      if (isVideoFile(pendingFile)) {
        if (pendingFile.size > MAX_VIDEO_BYTES) {
          alert("El video es muy grande. Prueba con uno más corto (máx. 30 MB).");
          return;
        }
        await saveVideo(id, pendingFile);
        data.fotos.push({
          id,
          albumId,
          mediaType: "video",
          title: title || "Video",
          date: new Date().toISOString(),
          by: yo,
        });
      } else {
        const dataUrl = await compressImage(pendingFile);
        await savePhoto(id, dataUrl);
        data.fotos.push({
          id,
          albumId,
          mediaType: "image",
          title: title || "Recuerdo",
          date: new Date().toISOString(),
          by: yo,
        });
      }
      await saveRecuerdos();
      pendingFile = null;
      document.getElementById("upload-title").value = "";
      document.getElementById("upload-modal")?.classList.add("hidden");
      renderRecuerdos(container);
    } catch {
      alert("No se pudo guardar. Intenta con otro archivo.");
    }
  });
}

async function exportEspacioZip() {
  await loadRecuerdos();
  const files = [];
  for (const f of data.fotos) {
    if (f.mediaType === "video") continue;
    const bytes = await photoToBytes(f.id);
    if (!bytes) continue;
    const d = new Date(f.date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const safe = (f.title || "foto").replace(/[^\w\-]+/g, "_").slice(0, 40);
    files.push({
      name: `${y}/${m}/${safe}-${f.id.slice(0, 8)}.jpg`,
      data: bytes,
    });
  }
  if (!files.length) {
    alert("Todavía no hay fotos guardadas para exportar.");
    return;
  }
  downloadBytes(buildZip(files), "nuestro-espacio.zip");
}

export function startRecuerdosPoll(container) {
  return setInterval(async () => {
    const prev = JSON.stringify(data.fotos);
    await loadRecuerdos();
    if (JSON.stringify(data.fotos) !== prev) renderEspacioFeed(container);
  }, 12000);
}
