import { getYo, PERSONAS, escapeHtml, formatText } from "../cloud.js";
import { dateKey } from "../plan.js";
import { isDiarioEnabled, guardarMomento, getMomentosTodos } from "../supabase-diario.js";
import { openPhotoEditor } from "../photo-editor.js";
import { buildZip, downloadBytes } from "../zip.js";
import { bindRipples } from "../motion.js";

const MES_NOM = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CATEGORIAS = [
  { id: "nosotros", label: "Nosotros", emoji: "♡" },
  { id: "viajes", label: "Viajes", emoji: "✈️" },
  { id: "especial", label: "Días especiales", emoji: "🎁" },
  { id: "comida", label: "Comida", emoji: "🍽️" },
  { id: "naturaleza", label: "Naturaleza", emoji: "🌿" },
  { id: "ciudad", label: "Ciudad", emoji: "🏙️" },
  { id: "casa", label: "Casa", emoji: "🏠" },
  { id: "otros", label: "Otros", emoji: "🍂" },
];

const PAGE_SIZE_MONTHS = 3;

let momentos = []; // todas las fotos guardadas: { id, date, persona, foto_url, caption, destino, categoria }
let pendingFile = null;
let pendingDestino = "ambos";
let pendingCategoria = "nosotros";
let view = "collage"; // "collage" | "recuerdos"
let activeCategoria = "todas";
let searchQuery = "";
let monthsShown = PAGE_SIZE_MONTHS;

function groupByDay(rows) {
  const byDay = new Map();
  for (const row of rows) {
    if (!byDay.has(row.date)) byDay.set(row.date, {});
    byDay.get(row.date)[row.persona] = row;
  }
  return byDay;
}

function groupByMonth(rows) {
  const byMonth = new Map();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(row);
  }
  return byMonth;
}

async function loadTodos() {
  momentos = isDiarioEnabled() ? await getMomentosTodos(500) : [];
}

function setupNoticeHtml() {
  return `
    <div class="card-dark anim-in momento-setup-notice">
      <h3>♡ Falta un paso</h3>
      <p class="espacio-sub">Para que las fotos se vean entre los dos (no solo en tu celular), hay que activar el almacenamiento compartido en <code>js/diario-config.js</code>. Es gratis y toma unos minutos — pídeselo a Diego.</p>
    </div>
  `;
}

function heroHtml() {
  return `
    <div class="espacio-hero-banner anim-in">
      <span class="espacio-hero-doodle" aria-hidden="true">good things<br>take time ♡</span>
      <h2 class="espacio-hero-title">Nuestro espacio <span>♡</span></h2>
      <p class="espacio-hero-quote">"Un collage para verlos juntos; un álbum para encontrarlos mes a mes."</p>
      <div class="espacio-hero-pills">
        <span class="espacio-hero-pill">♡ Más recuerdos</span>
        <span class="espacio-hero-pill">📍 Más aventuras</span>
        <span class="espacio-hero-pill">✈️ Siempre juntos</span>
      </div>
    </div>
  `;
}

function hoySlotsHtml(dayData) {
  const yo = getYo() || "diego";
  const partner = yo === "diego" ? "bianka" : "diego";
  const mio = dayData?.[yo];
  const suyo = dayData?.[partner];

  const slot = (persona, entry, isMine) => {
    if (entry) {
      return `
        <div class="momento-slot">
          <img src="${entry.foto_url}" alt="${PERSONAS[persona].nombre}" loading="lazy" />
          ${entry.caption ? `<p class="momento-slot-cap">${escapeHtml(entry.caption)}</p>` : ""}
          <span class="momento-slot-who">${PERSONAS[persona].emoji} ${PERSONAS[persona].nombre}</span>
          ${isMine ? `<button type="button" class="momento-slot-edit" id="momento-replace">Cambiar</button>` : ""}
        </div>`;
    }
    if (isMine) {
      return `
        <div class="momento-slot momento-slot-empty">
          <span class="momento-slot-icon">📷</span>
          <p class="momento-slot-cap">Sube tu foto de hoy</p>
          <button type="button" class="btn-pink btn-sm" id="momento-upload-btn">Elegir foto</button>
        </div>`;
    }
    return `
      <div class="momento-slot momento-slot-empty">
        <span class="momento-slot-icon">${PERSONAS[persona].emoji}</span>
        <p class="momento-slot-cap">${PERSONAS[persona].nombre} aún no sube la suya</p>
      </div>`;
  };

  return `
    <div class="momento-hoy card-dark anim-in">
      <h3 class="momento-hoy-title">Hoy · ${new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long" })}</h3>
      <div class="momento-hoy-slots">
        ${slot(yo, mio, true)}
        ${slot(partner, suyo, false)}
      </div>
      <div class="momento-hoy-form hidden" id="momento-form">
        <img id="momento-preview" class="momento-preview" alt="Vista previa" />
        <input type="text" id="momento-caption" class="input-field" placeholder="¿Qué pasó en esta foto? (opcional)" maxlength="140" />

        <p class="momento-form-label">¿Dónde se muestra?</p>
        <div class="momento-destino" role="radiogroup" aria-label="Dónde mostrar esta foto">
          <button type="button" class="momento-destino-btn active" data-destino="ambos">Collage + Recuerdos</button>
          <button type="button" class="momento-destino-btn" data-destino="collage">Solo Collage</button>
          <button type="button" class="momento-destino-btn" data-destino="recuerdos">Solo Recuerdos</button>
        </div>

        <p class="momento-form-label">Categoría</p>
        <div class="momento-categoria" role="radiogroup" aria-label="Categoría de la foto">
          ${CATEGORIAS.map((c) => `
            <button type="button" class="momento-categoria-btn ${c.id === "nosotros" ? "active" : ""}" data-categoria="${c.id}">${c.emoji} ${c.label}</button>
          `).join("")}
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="momento-cancel">Cancelar</button>
          <button type="button" class="btn" id="momento-save">Guardar</button>
        </div>
      </div>
      <input type="file" accept="image/*" id="momento-file-input" hidden />
    </div>
  `;
}

const MOSAIC_SIZE_CYCLE = ["mosaic-tall", "mosaic-featured", "mosaic-short", "mosaic-landscape", "mosaic-featured", "mosaic-tall", "mosaic-landscape", "mosaic-short"];

function mosaicItemHtml(entry, i) {
  const size = MOSAIC_SIZE_CYCLE[i % MOSAIC_SIZE_CYCLE.length];
  return `
    <button type="button" class="mosaic-item ${size} anim-in" data-id="${entry.id}" aria-label="Ver foto">
      <span class="mosaic-tape" aria-hidden="true"></span>
      <img src="${entry.foto_url}" alt="" loading="lazy" />
      <span class="mosaic-item-heart" aria-hidden="true">♥</span>
    </button>
  `;
}

function mosaicHtml(items) {
  if (!items.length) return "";
  const pieces = [];
  items.forEach((item, i) => {
    pieces.push(mosaicItemHtml(item, i));
    if (i === 2) pieces.push('<div class="mosaic-note mosaic-note-adventure" aria-hidden="true"><span>Aventuras<br />juntos</span><b>♡</b></div>');
    if (i === 7) pieces.push('<div class="mosaic-note mosaic-note-story" aria-hidden="true"><span>Más locuras,<br />mejores historias</span><b>♡</b></div>');
  });
  return `
    <div class="mosaic-board">
      ${pieces.join("")}
      <span class="mosaic-doodle mosaic-doodle-heart" aria-hidden="true">♡</span>
      <span class="mosaic-doodle mosaic-doodle-heart-small" aria-hidden="true">♡</span>
      <span class="mosaic-doodle mosaic-doodle-spark" aria-hidden="true">✦</span>
      <span class="mosaic-doodle mosaic-doodle-flower" aria-hidden="true">✿</span>
      <span class="mosaic-doodle-swoosh" aria-hidden="true"></span>
    </div>
  `;
}

function collageViewHtml(rows) {
  const items = rows
    .filter((r) => r.destino !== "recuerdos")
    .sort((a, b) => b.date.localeCompare(a.date) || b.persona.localeCompare(a.persona));

  return `
    <section class="collage-card collage-single-card">
      ${collageCardDecorHtml()}
      <div class="collage-card-head">
        <div class="collage-card-head-icon" aria-hidden="true">🖼️</div>
        <div>
          <h3>Nuestro collage</h3>
          <p class="espacio-sub">Se va llenando con cada recuerdo que subimos</p>
        </div>
        ${items.length ? `<span class="collage-total">${items.length} ${items.length === 1 ? "foto" : "fotos"}</span>` : ""}
      </div>
      ${items.length
        ? mosaicHtml(items)
        : `<div class="empty-illustration"><span>♡</span><p>Nuestro collage está esperando su primera foto</p><small>Sube una foto de hoy y empezará a crecer</small></div>`}
    </section>
  `;
}

function collageCardDecorHtml() {
  return `
    <span class="collage-deco deco-heart-1" aria-hidden="true">♡</span>
    <span class="collage-deco deco-heart-2" aria-hidden="true">♡</span>
    <span class="collage-deco deco-sprig" aria-hidden="true">🌿</span>
  `;
}

function recuerdosMonthHtml(key, rows) {
  const [y, m] = key.split("-");
  const label = `${MES_NOM[Number(m) - 1]} ${y}`;
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date) || a.persona.localeCompare(b.persona));
  const featured = sorted.length >= 3;
  return `
    <section class="recuerdos-month anim-in">
      <div class="recuerdos-month-head">
        <div>
          <h3 class="recuerdos-month-title">${label}</h3>
          <p class="recuerdos-month-sub">${sorted.length} ${sorted.length === 1 ? "recuerdo" : "recuerdos"}</p>
        </div>
        <span class="recuerdos-month-count" aria-hidden="true">♡</span>
      </div>
      <div class="recuerdos-grid">
        ${sorted.map((e, i) => `
          <button type="button" class="recuerdos-item ${featured && i === 0 ? "recuerdos-featured" : ""}" data-id="${e.id}" aria-label="${escapeHtml(e.caption || `Foto de ${PERSONAS[e.persona]?.nombre || "ustedes"}`)}">
            <img src="${e.foto_url}" alt="" loading="lazy" />
            ${e.caption ? `<span class="recuerdos-item-caption">${escapeHtml(e.caption)}</span>` : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function filterRecuerdos(rows) {
  let items = rows.filter((r) => r.destino !== "collage");
  if (activeCategoria !== "todas") items = items.filter((r) => r.categoria === activeCategoria);
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    items = items.filter((r) =>
      (r.caption || "").toLowerCase().includes(q) ||
      r.date.includes(q) ||
      PERSONAS[r.persona]?.nombre.toLowerCase().includes(q)
    );
  }
  return items;
}

function recuerdosHeadHtml() {
  return `
    <div class="collage-card-head recuerdos-head">
      <div class="collage-card-head-icon" aria-hidden="true">📚</div>
      <div>
        <h3>Todas nuestras fotos</h3>
        <p class="espacio-sub">Aquí se guardan todos nuestros momentos, en orden cronológico.</p>
      </div>
    </div>
    <div class="recuerdos-search-row">
      <div class="recuerdos-search">
        <span aria-hidden="true">🔍</span>
        <input type="text" id="recuerdos-search-input" placeholder="Buscar por fecha, lugar o palabra…" value="${escapeHtml(searchQuery)}" />
      </div>
    </div>
    <div class="recuerdos-cats">
      <button type="button" class="recuerdos-cat-btn ${activeCategoria === "todas" ? "active" : ""}" data-cat="todas">Todas</button>
      ${CATEGORIAS.map((c) => `
        <button type="button" class="recuerdos-cat-btn ${activeCategoria === c.id ? "active" : ""}" data-cat="${c.id}">${c.emoji} ${c.label}</button>
      `).join("")}
    </div>
  `;
}

function recuerdosViewHtml(rows) {
  const items = filterRecuerdos(rows);
  const head = recuerdosHeadHtml();

  if (!items.length) {
    return `${head}<div class="empty-illustration"><span>📷</span><p>No encontramos fotos con ese filtro</p><small>Prueba con otra categoría o búsqueda</small></div>`;
  }

  const byMonth = groupByMonth(items);
  const keys = [...byMonth.keys()].sort().reverse();
  const shown = keys.slice(0, monthsShown);
  const rest = keys.length - shown.length;

  return `
    ${head}
    <div id="recuerdos-months">${shown.map((k) => recuerdosMonthHtml(k, byMonth.get(k))).join("")}</div>
    ${rest > 0 ? `<button type="button" class="espacio-load-more" id="recuerdos-load-more">Cargar más fotos ⌄</button>` : ""}
  `;
}

function recuerdosTabHtml(rows) {
  const today = groupByDay(rows).get(dateKey(new Date()));
  return `
    <details class="momento-hoy-details">
      <summary>
        <span class="momento-hoy-details-icon" aria-hidden="true">📷</span>
        <span class="momento-hoy-details-copy"><strong>Fotos de hoy</strong><small>Sube o actualiza un recuerdo</small></span>
        <span class="momento-hoy-details-toggle" aria-hidden="true">＋</span>
      </summary>
      ${hoySlotsHtml(today)}
    </details>
    ${recuerdosViewHtml(rows)}
  `;
}

export async function renderRecuerdos(container) {
  await loadTodos();
  pendingFile = null;
  pendingDestino = "ambos";
  pendingCategoria = "nosotros";
  monthsShown = PAGE_SIZE_MONTHS;
  container.innerHTML = `
    ${heroHtml()}

    ${!isDiarioEnabled() ? setupNoticeHtml() : ""}

    ${
      isDiarioEnabled()
        ? `
      <div class="espacio-tabs" role="tablist">
        <button type="button" class="espacio-tab ${view === "collage" ? "active" : ""}" data-view="collage" role="tab">✦ Collage</button>
        <button type="button" class="espacio-tab ${view === "recuerdos" ? "active" : ""}" data-view="recuerdos" role="tab">☰ Por mes</button>
      </div>
      <button type="button" class="espacio-export-btn" id="export-zip">Descargar todas (ZIP)</button>
      <div id="espacio-view">${view === "collage" ? collageViewHtml(momentos) : recuerdosTabHtml(momentos)}</div>
      `
        : ""
    }

    <div class="modal hidden" id="momento-lightbox">
      <div class="modal-box momento-lightbox-box">
        <button type="button" class="modal-close momento-lightbox-close" id="momento-lightbox-close" aria-label="Cerrar">×</button>
        <img id="momento-lightbox-img" class="momento-lightbox-img" alt="" />
        <div class="momento-lightbox-info">
          <span class="momento-lightbox-who" id="momento-lightbox-who"></span>
          <time class="momento-lightbox-when" id="momento-lightbox-when"></time>
          <p class="momento-lightbox-cap" id="momento-lightbox-cap"></p>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".anim-in").forEach((el) => el.classList.add("anim-play"));
  bindRecuerdosEvents(container);
}

function bindRecuerdosEvents(container) {
  const byId = new Map(momentos.map((e) => [String(e.id), e]));

  container.querySelectorAll(".espacio-tab[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.view === view) return;
        view = btn.dataset.view;
        container.querySelectorAll(".espacio-tab").forEach((b) => b.classList.toggle("active", b === btn));
        renderView(container, byId);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
  });

  bindViewInteractions(container, byId);
  bindMomentoUploadEvents(container);

  document.getElementById("momento-lightbox-close")?.addEventListener("click", closeLightbox);
  document.getElementById("momento-lightbox")?.addEventListener("click", (e) => {
    if (e.target.id === "momento-lightbox") closeLightbox();
  });

  document.getElementById("export-zip")?.addEventListener("click", () => exportEspacioZip());
}

function bindMomentoUploadEvents(container) {
  const openPicker = () => document.getElementById("momento-file-input")?.click();
  document.getElementById("momento-upload-btn")?.addEventListener("click", openPicker);
  document.getElementById("momento-replace")?.addEventListener("click", openPicker);

  document.getElementById("momento-file-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const edited = await openPhotoEditor(file);
    if (!edited) return;
    pendingFile = edited;
    const preview = document.getElementById("momento-preview");
    if (preview) preview.src = URL.createObjectURL(edited);
    document.getElementById("momento-form")?.classList.remove("hidden");
  });

  container.querySelectorAll(".momento-destino-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingDestino = btn.dataset.destino;
      container.querySelectorAll(".momento-destino-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  container.querySelectorAll(".momento-categoria-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingCategoria = btn.dataset.categoria;
      container.querySelectorAll(".momento-categoria-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  document.getElementById("momento-cancel")?.addEventListener("click", () => {
    pendingFile = null;
    document.getElementById("momento-form")?.classList.add("hidden");
  });

  document.getElementById("momento-save")?.addEventListener("click", async () => {
    if (!pendingFile) return;
    const btn = document.getElementById("momento-save");
    btn.disabled = true;
    btn.textContent = "Subiendo…";
    try {
      const yo = getYo() || "diego";
      const caption = document.getElementById("momento-caption").value.trim();
      await guardarMomento(dateKey(new Date()), yo, pendingFile, caption, pendingDestino, pendingCategoria);
      pendingFile = null;
      await renderRecuerdos(container);
    } catch {
      alert("No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.");
      btn.disabled = false;
      btn.textContent = "Guardar";
    }
  });
}

function renderView(container, byId) {
  const viewEl = document.getElementById("espacio-view");
  if (!viewEl) return;
  viewEl.innerHTML = view === "collage" ? collageViewHtml(momentos) : recuerdosTabHtml(momentos);
  viewEl.querySelectorAll(".anim-in").forEach((el) => el.classList.add("anim-play"));
  bindViewInteractions(container, byId);
  if (view === "recuerdos") bindMomentoUploadEvents(container);
  bindRipples(viewEl);
}

function bindViewInteractions(container, byId) {
  container.querySelectorAll(".collage-item[data-id], .collage-note[data-id], .recuerdos-item[data-id], .mosaic-item[data-id]").forEach((el) => {
    el.addEventListener("click", () => openLightbox(byId.get(el.dataset.id)));
  });

  document.getElementById("recuerdos-search-input")?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    monthsShown = PAGE_SIZE_MONTHS;
    renderView(container, byId);
    document.getElementById("recuerdos-search-input")?.focus();
    const val = document.getElementById("recuerdos-search-input");
    if (val) val.selectionStart = val.selectionEnd = val.value.length;
  });

  container.querySelectorAll(".recuerdos-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategoria = btn.dataset.cat;
      monthsShown = PAGE_SIZE_MONTHS;
      renderView(container, byId);
    });
  });

  document.getElementById("recuerdos-load-more")?.addEventListener("click", () => {
    monthsShown += PAGE_SIZE_MONTHS;
    renderView(container, byId);
  });
}

function openLightbox(entry) {
  if (!entry) return;
  const modal = document.getElementById("momento-lightbox");
  const img = document.getElementById("momento-lightbox-img");
  const who = document.getElementById("momento-lightbox-who");
  const when = document.getElementById("momento-lightbox-when");
  const cap = document.getElementById("momento-lightbox-cap");
  if (!modal || !img) return;

  img.src = entry.foto_url;
  who.textContent = `${PERSONAS[entry.persona]?.emoji || ""} ${PERSONAS[entry.persona]?.nombre || ""}`;
  when.textContent = new Date(entry.date + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  cap.innerHTML = entry.caption ? formatText(entry.caption) : "";
  cap.hidden = !entry.caption;

  modal.classList.remove("hidden");
}

function closeLightbox() {
  document.getElementById("momento-lightbox")?.classList.add("hidden");
}

async function exportEspacioZip() {
  const btn = document.getElementById("export-zip");
  if (!momentos.length || !btn) return;
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "Preparando…";

  const files = [];
  for (const e of momentos) {
    try {
      const bytes = new Uint8Array(await (await fetch(e.foto_url)).arrayBuffer());
      const y = e.date.slice(0, 4);
      const m = e.date.slice(5, 7);
      const safe = (e.caption || "foto").replace(/[^\w-]+/g, "_").slice(0, 40);
      files.push({ name: `${y}/${m}/${e.date}-${e.persona}-${safe}.jpg`, data: bytes });
    } catch { /* se salta la que falle */ }
  }

  btn.disabled = false;
  btn.textContent = original;

  if (!files.length) {
    alert("No se pudo descargar ninguna foto.");
    return;
  }
  downloadBytes(buildZip(files), "nuestro-espacio.zip");
}

export function startRecuerdosPoll(container) {
  return setInterval(async () => {
    const prev = JSON.stringify(momentos);
    await loadTodos();
    if (JSON.stringify(momentos) !== prev) renderRecuerdos(container);
  }, 15000);
}
