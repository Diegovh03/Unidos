import {
  cloudGet,
  cloudSet,
  compressImage,
  formatText,
  getYo,
  uid,
  PERSONAS,
  savePhoto,
  loadPhoto,
  deletePhoto,
} from "../cloud.js";
import { saveVideo, loadVideo, deleteVideo, isVideoFile, MAX_VIDEO_BYTES } from "../media.js";

let entries = [];
let pendingPhoto = null;
let pendingVideo = null;

function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function loadDiario() {
  const remote = await cloudGet("diario");
  if (Array.isArray(remote)) entries = remote;
  else {
    const local = localStorage.getItem("diario-cache");
    if (local) try { entries = JSON.parse(local); } catch { /* ignore */ }
  }
}

async function saveDiario() {
  localStorage.setItem("diario-cache", JSON.stringify(entries));
  await cloudSet("diario", entries);
}

export async function renderDiario(container) {
  await loadDiario();
  pendingPhoto = null;
  pendingVideo = null;

  container.innerHTML = `
    <div class="espacio-hero anim-in">
      <h2 class="espacio-title">Diario 💭</h2>
      <p class="espacio-sub">Pensamientos que WhatsApp no guarda bonito — van a nuestro espacio</p>
    </div>

    <form class="diario-compose card-dark hidden" id="diario-form">
      <textarea id="diario-text" class="diario-textarea" rows="4"
        placeholder="Lo que piensas, soñaste, extrañas o quieres que el otro lea algún día…"></textarea>
      <div class="diario-preview hidden" id="diario-preview-wrap">
        <img id="diario-preview" alt="Vista previa" class="hidden" />
        <video id="diario-preview-video" controls playsinline class="hidden"></video>
        <button type="button" class="preview-remove" id="diario-preview-remove">×</button>
      </div>
      <div class="diario-compose-bar">
        <label class="compose-attach">
          <input type="file" accept="image/*,video/*" id="diario-media-input" hidden />
          <span class="attach-icon">📎</span>
          <span>Foto o video</span>
        </label>
        <button type="submit" class="btn btn-publish">Guardar 💕</button>
      </div>
    </form>

    <div class="diario-feed" id="diario-feed"></div>
    <button type="button" class="fab" id="diario-fab" aria-label="Nueva entrada">+</button>
  `;

  bindDiarioForm();
  document.getElementById("diario-fab")?.addEventListener("click", () => {
    document.getElementById("diario-form")?.classList.remove("hidden");
    document.getElementById("diario-form")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("diario-text")?.focus();
  });
  await renderFeed();
}

function clearPreview() {
  pendingPhoto = null;
  pendingVideo = null;
  document.getElementById("diario-preview-wrap")?.classList.add("hidden");
  document.getElementById("diario-preview")?.classList.add("hidden");
  document.getElementById("diario-preview-video")?.classList.add("hidden");
}

function bindDiarioForm() {
  document.getElementById("diario-media-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      clearPreview();
      const wrap = document.getElementById("diario-preview-wrap");
      if (isVideoFile(file)) {
        if (file.size > MAX_VIDEO_BYTES) {
          alert("Video muy grande (máx. 30 MB).");
          return;
        }
        pendingVideo = file;
        const vid = document.getElementById("diario-preview-video");
        vid.src = URL.createObjectURL(file);
        vid.classList.remove("hidden");
      } else {
        pendingPhoto = await compressImage(file);
        const img = document.getElementById("diario-preview");
        img.src = pendingPhoto;
        img.classList.remove("hidden");
      }
      wrap.classList.remove("hidden");
    } catch {
      alert("No se pudo cargar el archivo.");
    }
    e.target.value = "";
  });

  document.getElementById("diario-preview-remove")?.addEventListener("click", clearPreview);

  document.getElementById("diario-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("diario-text").value.trim();
    if (!text && !pendingPhoto && !pendingVideo) return;

    const yo = getYo() || "diego";
    const entry = {
      id: uid(),
      text: text || "",
      date: new Date().toISOString(),
      by: yo,
    };

    if (pendingPhoto) {
      const photoId = uid();
      await savePhoto(photoId, pendingPhoto);
      entry.photoId = photoId;
    }
    if (pendingVideo) {
      const videoId = uid();
      await saveVideo(videoId, pendingVideo);
      entry.videoId = videoId;
    }

    entries.unshift(entry);
    await saveDiario();

    document.getElementById("diario-text").value = "";
    clearPreview();
    document.getElementById("diario-form")?.classList.add("hidden");
    await renderFeed();
  });
}

async function renderFeed() {
  const feed = document.getElementById("diario-feed");
  if (!feed) return;

  if (!entries.length) {
    feed.innerHTML = `
      <div class="empty-illustration">
        <span>📔</span>
        <p>El diario está vacío</p>
        <small>Escribe un pensamiento o adjunta foto/video — aparecerá en Nuestro espacio</small>
      </div>`;
    return;
  }

  feed.innerHTML = entries.map((e, i) => `
    <article class="diario-entry anim-in" style="animation-delay:${i * 0.08}s">
      <time class="diario-date">${formatDateLong(e.date)}</time>
      ${e.text ? `<p class="diario-body">${formatText(e.text)}</p>` : ""}
      ${e.photoId ? `<div class="diario-photo" id="diario-photo-${e.id}"><div class="photo-loading">🌷</div></div>` : ""}
      ${e.videoId ? `<div class="diario-photo" id="diario-video-${e.id}"><div class="photo-loading">🎬</div></div>` : ""}
      <div class="diario-meta">${PERSONAS[e.by]?.emoji || "💕"} ${PERSONAS[e.by]?.nombre || ""}</div>
      <button type="button" class="diario-del" data-id="${e.id}" data-photo="${e.photoId || ""}" data-video="${e.videoId || ""}" aria-label="Eliminar">×</button>
    </article>
  `).join("");

  feed.querySelectorAll(".diario-entry").forEach((el) => el.classList.add("anim-play"));

  for (const e of entries) {
    if (e.photoId) {
      const el = document.getElementById(`diario-photo-${e.id}`);
      const data = await loadPhoto(e.photoId);
      if (data && el) el.innerHTML = `<img src="${data}" alt="Foto" loading="lazy" />`;
    }
    if (e.videoId) {
      const el = document.getElementById(`diario-video-${e.id}`);
      const src = await loadVideo(e.videoId);
      if (src && el) el.innerHTML = `<video src="${src}" controls playsinline preload="metadata"></video>`;
    }
  }

  feed.querySelectorAll(".diario-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (btn.dataset.photo) await deletePhoto(btn.dataset.photo);
      if (btn.dataset.video) await deleteVideo(btn.dataset.video);
      entries = entries.filter((x) => x.id !== btn.dataset.id);
      await saveDiario();
      await renderFeed();
    });
  });
}

export function startDiarioPoll() {
  return setInterval(async () => {
    const prev = JSON.stringify(entries);
    await loadDiario();
    if (JSON.stringify(entries) !== prev) await renderFeed();
  }, 10000);
}
