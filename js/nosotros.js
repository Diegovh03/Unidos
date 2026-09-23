import { FOTO_BIANKA, FOTO_DIEGO } from "./lugares.js";
import { getDaysTogether } from "./plan.js";
import { getYo, setYo, clearYo } from "./cloud.js";

const STORAGE_KEY = "nuestro-plan-notas";

const SECTIONS = [
  { id: "musica", title: "Música" },
  { id: "detalles", title: "Cosas que le gustan" },
  { id: "regalos", title: "Para sorprender" },
  { id: "extra", title: "Más de ti" },
];

const FIELDS = [
  {
    id: "artistas",
    section: "musica",
    type: "rank5",
    emoji: "🎵",
    label: "Top 5 artistas",
    hint: "Los que más escuchas ahora",
    placeholder: "Nombre del artista",
  },
  {
    id: "canciones",
    section: "musica",
    type: "rank5",
    emoji: "💿",
    label: "Top 5 canciones",
    hint: "Las que te derriten o pones en repeat",
    placeholder: "Canción — artista",
  },
  {
    id: "comida",
    section: "detalles",
    type: "text",
    emoji: "🍝",
    label: "Comida, postres y cafés",
    hint: "Favoritos, antojos, restaurantes",
    placeholder: "Sushi, cheesecake de maracuyá, café con vainilla…",
    rows: 3,
  },
  {
    id: "flores",
    section: "detalles",
    type: "text",
    emoji: "🌷",
    label: "Flores, colores y olores",
    hint: "Para un ramo, una vela o un detalle",
    placeholder: "Tulipanes lila, rosa palo, vainilla…",
    rows: 3,
  },
  {
    id: "series",
    section: "detalles",
    type: "text",
    emoji: "🎬",
    label: "Pelis, series y anime",
    hint: "Para una noche de cine virtual",
    placeholder: "Película favorita, serie que quieres ver juntos…",
    rows: 3,
  },
  {
    id: "hobbies",
    section: "detalles",
    type: "text",
    emoji: "✨",
    label: "Hobbies y obsesiones",
    hint: "Gatitos, gym, dibujo, fútbol…",
    placeholder: "Lo que te absorbe el rato libre",
    rows: 3,
  },
  {
    id: "gustos",
    section: "detalles",
    type: "text",
    emoji: "💕",
    label: "Otras cosas que te gustan",
    hint: "Lo que no entra arriba",
    placeholder: "Perritos, una marca, un snack random…",
    rows: 3,
  },
  {
    id: "noGustos",
    section: "regalos",
    type: "text",
    emoji: "🚫",
    label: "Cosas que NO te gustan",
    hint: "Alergias, olores, regalos que no — así no se equivoca",
    placeholder: "No chocolate amargo, no perfume X, no sorpresas en público…",
    rows: 3,
  },
  {
    id: "regalos",
    section: "regalos",
    type: "text",
    emoji: "🎁",
    label: "Ideas de regalos",
    hint: "Links, talla, marcas, wishlist",
    placeholder: "Talla M, anillo talla…, link de Pinterest…",
    rows: 4,
  },
  {
    id: "sorpresas",
    section: "regalos",
    type: "text",
    emoji: "🤫",
    label: "Cómo te gusta que te sorprendan",
    hint: "Cartas, videollamada, un paquete, un plan",
    placeholder: "Me encanta que me escriban a mano, o un date sin avisar…",
    rows: 3,
  },
  {
    id: "diaFeliz",
    section: "extra",
    type: "text",
    emoji: "☀️",
    label: "Un día perfecto para ti",
    hint: "Para armar un date a tu medida",
    placeholder: "Desayuno rico, caminar, película, mimos…",
    rows: 3,
  },
  {
    id: "pensamientos",
    section: "extra",
    type: "text",
    emoji: "💭",
    label: "Algo que quieres que sepa",
    hint: "Solo para ustedes",
    placeholder: "Lo que piensas, sueñas o quieres que el otro recuerde…",
    rows: 5,
  },
];

const PERSONAS = {
  diego: { nombre: "Diego", emoji: "🐶" },
  bianka: { nombre: "Bianka", emoji: "🐱" },
};

function emptyPerson() {
  const row = { updatedAt: null };
  for (const field of FIELDS) row[field.id] = "";
  return row;
}

function normalizePerson(raw = {}) {
  const row = { ...emptyPerson(), ...raw };
  for (const field of FIELDS) {
    if (typeof row[field.id] !== "string") row[field.id] = "";
  }
  return row;
}

let yo = getYo();
let viewing = yo || "bianka";
let notas = loadNotas();
let saveTimer = null;

function loadNotas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { diego: emptyPerson(), bianka: emptyPerson() };
    const parsed = JSON.parse(raw);
    return {
      diego: normalizePerson(parsed.diego),
      bianka: normalizePerson(parsed.bianka),
    };
  } catch {
    return { diego: emptyPerson(), bianka: emptyPerson() };
  }
}

function saveNotas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
  pushToCloud();
}

function setSaveStatus(text, ok = true) {
  const el = document.getElementById("notas-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("saved", ok);
  el.classList.toggle("saving", !ok);
}

function isOwnSection(person) {
  return yo && person === yo;
}

function fieldValue(data, id) {
  return String(data?.[id] || "").trim();
}

function filledCount(data) {
  return FIELDS.filter((field) => fieldValue(data, field.id)).length;
}

function rankLines(value) {
  const lines = String(value || "").split("\n");
  return Array.from({ length: 5 }, (_, i) => (lines[i] || "").trim());
}

function renderYoPicker() {
  const container = document.getElementById("nosotros-content");
  if (!container) return;

  container.innerHTML = `
    <div class="yo-picker">
      <p class="yo-picker-title">¿Quién eres?</p>
      <p class="yo-picker-sub">Así sabemos quién escribe la ficha y quién solo la lee 💕</p>
      <div class="yo-picker-btns">
        <button type="button" class="yo-btn" data-yo="diego">🐶 Soy Diego</button>
        <button type="button" class="yo-btn" data-yo="bianka">🐱 Soy Bianka</button>
      </div>
    </div>
  `;

  container.querySelectorAll(".yo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      yo = btn.dataset.yo;
      setYo(yo);
      viewing = yo;
      renderNotas();
      pullFromCloud();
    });
  });
}

function renderNotas() {
  const container = document.getElementById("nosotros-content");
  if (!container) return;

  if (!yo) {
    renderYoPicker();
    return;
  }

  const p = PERSONAS[viewing];
  const data = notas[viewing];
  const own = isOwnSection(viewing);
  const filled = filledCount(data);
  const total = FIELDS.length;
  const pct = Math.round((filled / total) * 100);

  container.innerHTML = `
    <div class="yo-bar">
      <span>Hola, ${PERSONAS[yo].emoji} ${PERSONAS[yo].nombre}</span>
      <button type="button" class="yo-change" id="yo-change">Cambiar</button>
    </div>

    <div class="nosotros-tabs">
      ${Object.entries(PERSONAS)
        .map(
          ([key, info]) => `
        <button type="button" class="nosotros-tab ${key === viewing ? "active" : ""}" data-person="${key}">
          ${info.emoji} ${key === yo ? "Mi ficha" : `Ficha de ${info.nombre}`}
        </button>`
        )
        .join("")}
    </div>

    <div class="ficha-progress">
      <div class="ficha-progress-top">
        <span>${own ? "Tu ficha para sorpresas" : `Ficha de ${p.nombre}`}</span>
        <strong>${filled}/${total}</strong>
      </div>
      <div class="ficha-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <p class="nosotros-hint">
        ${own
          ? "Llénalo para que sepa cómo sorprenderte. Se guarda sola mientras escribes 🌷"
          : `Léelo para dates, regalos y detallecitos — sin preguntar y arruinar la sorpresa 💕`}
      </p>
    </div>

    <p class="notas-status" id="notas-status">${own ? "Guardado 🌷" : filled ? `${filled} datos para inspirarte` : ""}</p>

    ${own ? renderEditFields(data) : renderReadFields(data, p)}
  `;

  if (own) bindEditEvents();

  document.getElementById("yo-change")?.addEventListener("click", () => {
    if (own) saveFromFields();
    clearYo();
    yo = null;
    renderYoPicker();
  });

  document.querySelectorAll(".nosotros-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isOwnSection(viewing)) saveFromFields();
      viewing = btn.dataset.person;
      renderNotas();
    });
  });
}

function renderEditFields(data) {
  return SECTIONS.map((section) => {
    const fields = FIELDS.filter((f) => f.section === section.id);
    const title = section.id === "detalles" ? "Cosas que te gustan" : section.title;
    return `
      <section class="ficha-section">
        <h3 class="ficha-section-title">${title}</h3>
        ${fields.map((field) => renderEditField(field, data)).join("")}
      </section>
    `;
  }).join("");
}

function renderEditField(field, data) {
  if (field.type === "rank5") {
    const lines = rankLines(data[field.id]);
    return `
      <div class="notas-block ficha-card">
        <p class="nosotros-subtitle">${field.emoji} ${field.label}</p>
        <p class="ficha-hint">${field.hint}</p>
        <ol class="ficha-rank">
          ${lines
            .map(
              (line, i) => `
            <li>
              <span>${i + 1}</span>
              <input type="text" class="input-dark ficha-rank-input" data-field="${field.id}" data-i="${i}"
                maxlength="80" placeholder="${field.placeholder}" value="${escapeAttr(line)}" />
            </li>`
            )
            .join("")}
        </ol>
      </div>
    `;
  }

  return `
    <div class="notas-block ficha-card">
      <label class="nosotros-subtitle" for="ficha-${field.id}">${field.emoji} ${field.label}</label>
      <p class="ficha-hint">${field.hint}</p>
      <textarea id="ficha-${field.id}" class="notas-area" data-field="${field.id}" rows="${field.rows || 3}"
        placeholder="${field.placeholder}">${escapeText(data[field.id] || "")}</textarea>
    </div>
  `;
}

function renderReadFields(data, person) {
  const filled = FIELDS.filter((field) => fieldValue(data, field.id));
  if (!filled.length) {
        return `<p class="empty-state">${person.nombre} todavía no llenó su ficha. Cuando lo haga, acá aparecen las pistas para ${person.nombre === "Bianka" ? "sorprenderla" : "sorprenderlo"} 🎁</p>`;
  }

  return SECTIONS.map((section) => {
    const fields = FIELDS.filter((f) => f.section === section.id && fieldValue(data, f.id));
    if (!fields.length) return "";
    return `
      <section class="ficha-section">
        <h3 class="ficha-section-title">${section.title}</h3>
        <div class="notas-readonly">
          ${fields.map((field) => renderReadField(field, data)).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderReadField(field, data) {
  if (field.type === "rank5") {
    const items = rankLines(data[field.id]).filter(Boolean);
    return `
      <div class="notas-read-block">
        <h3>${field.emoji} ${field.label}</h3>
        <ol class="ficha-read-list">
          ${items.map((item) => `<li>${formatText(item)}</li>`).join("")}
        </ol>
      </div>
    `;
  }
  return `
    <div class="notas-read-block">
      <h3>${field.emoji} ${field.label}</h3>
      <p>${formatText(fieldValue(data, field.id))}</p>
    </div>
  `;
}

function escapeAttr(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatText(text) {
  return escapeText(text).replace(/\n/g, "<br>");
}

function bindEditEvents() {
  const fields = document.querySelectorAll("[data-field]");
  fields.forEach((el) => {
    el.addEventListener("input", () => {
      setSaveStatus("Guardando…", false);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveFromFields();
        setSaveStatus("Guardado 🌷", true);
      }, 350);
    });
    el.addEventListener("blur", saveFromFields);
  });
}

function saveFromFields() {
  if (!yo || viewing !== yo) return;
  const next = normalizePerson(notas[yo]);
  let found = false;

  document.querySelectorAll("textarea[data-field]").forEach((el) => {
    found = true;
    next[el.dataset.field] = el.value;
  });

  const ranks = {};
  document.querySelectorAll("input.ficha-rank-input").forEach((el) => {
    found = true;
    const id = el.dataset.field;
    if (!ranks[id]) ranks[id] = ["", "", "", "", ""];
    ranks[id][Number(el.dataset.i)] = el.value;
  });
  for (const [id, lines] of Object.entries(ranks)) {
    next[id] = lines.join("\n");
  }

  if (!found) return;
  next.updatedAt = new Date().toISOString();
  notas[yo] = next;
  saveNotas();

  const status = document.getElementById("notas-status");
  const top = document.querySelector(".ficha-progress-top strong");
  const bar = document.querySelector(".ficha-bar i");
  const filled = filledCount(next);
  if (top) top.textContent = `${filled}/${FIELDS.length}`;
  if (bar) bar.style.width = `${Math.round((filled / FIELDS.length) * 100)}%`;
  if (status && !status.classList.contains("saving")) {
    status.textContent = "Guardado 🌷";
  }
}

async function pushToCloud() {
  try {
    const { cloudConfig } = await import("./cloud-config.js");
    if (!cloudConfig.enabled) return;

    const url = `${cloudConfig.baseUrl}/${cloudConfig.path}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notas),
    });
  } catch {
    /* sin conexión = solo local */
  }
}

async function pullFromCloud() {
  try {
    const { cloudConfig } = await import("./cloud-config.js");
    if (!cloudConfig.enabled) return;

    const url = `${cloudConfig.baseUrl}/${cloudConfig.path}`;
    const res = await fetch(url);
    if (!res.ok) return;

    const remote = await res.json();
    if (!remote?.diego || !remote?.bianka) return;

    notas = {
      diego: normalizePerson(remote.diego),
      bianka: normalizePerson(remote.bianka),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));

    const editing = document.activeElement?.matches("[data-field]");
    if (!editing) renderNotas();
  } catch {
    /* ignore */
  }
}

export function renderNosotros(container) {
  yo = getYo();
  if (yo) viewing = yo;
  const days = getDaysTogether();
  container.innerHTML = `
    <div class="perfil-hero anim-in">
      <div class="perfil-photos">
        <img src="${FOTO_BIANKA}" alt="Bianka" />
        <img src="${FOTO_DIEGO}" alt="Diego" />
      </div>
      <h2>Unidos</h2>
      <p>Juntos desde el 24 de junio de 2026 · ${days} días</p>
      <p class="perfil-lead">Fichas para conocerse y armar sorpresas</p>
    </div>
  `;
  const wrap = document.createElement("div");
  wrap.id = "nosotros-content";
  container.appendChild(wrap);
  renderNotas();
  pullFromCloud();
}

let pollInterval = null;

export function startNosotrosPoll() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(pullFromCloud, 8000);
}

export function stopNosotrosPoll() {
  if (pollInterval) clearInterval(pollInterval);
}

export function getNotas() {
  return notas;
}
