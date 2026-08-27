const STORAGE_KEY = "nuestro-plan-notas";
const YO_KEY = "nuestro-plan-yo";

const DEFAULT_NOTAS = {
  diego: { gustos: "", pensamientos: "", updatedAt: null },
  bianka: { gustos: "", pensamientos: "", updatedAt: null },
};

const PERSONAS = {
  diego: { nombre: "Diego", emoji: "🐶" },
  bianka: { nombre: "Bianka", emoji: "🐱" },
};

let yo = localStorage.getItem(YO_KEY);
let viewing = yo || "bianka";
let notas = loadNotas();
let saveTimer = null;

function loadNotas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_NOTAS);
    const parsed = JSON.parse(raw);
    return {
      diego: { ...DEFAULT_NOTAS.diego, ...parsed.diego },
      bianka: { ...DEFAULT_NOTAS.bianka, ...parsed.bianka },
    };
  } catch {
    return structuredClone(DEFAULT_NOTAS);
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

function renderYoPicker() {
  const container = document.getElementById("nosotros-content");
  if (!container) return;

  container.innerHTML = `
    <div class="yo-picker">
      <p class="yo-picker-title">¿Quién eres?</p>
      <p class="yo-picker-sub">Así sabemos quién escribe y quién solo lee 💕</p>
      <div class="yo-picker-btns">
        <button type="button" class="yo-btn" data-yo="diego">🐶 Soy Diego</button>
        <button type="button" class="yo-btn" data-yo="bianka">🐱 Soy Bianka</button>
      </div>
    </div>
  `;

  container.querySelectorAll(".yo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      yo = btn.dataset.yo;
      localStorage.setItem(YO_KEY, yo);
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
  const other = viewing === "diego" ? "bianka" : "diego";

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
          ${info.emoji} ${key === yo ? "Mis notas" : `Ver ${info.nombre}`}
        </button>`
        )
        .join("")}
    </div>

    <p class="nosotros-hint">
      ${own
        ? "Escribe libremente — se guarda sola mientras escribes 🌷"
        : `Lo que ${p.nombre} ha escrito para que lo conozcas mejor 💕`}
    </p>

    <p class="notas-status" id="notas-status">${own ? "Guardado 🌷" : ""}</p>

    ${own ? renderEditFields() : renderReadFields(data)}
  `;

  if (own) {
    document.getElementById("notas-gustos").value = data.gustos || "";
    document.getElementById("notas-pensamientos").value = data.pensamientos || "";
    bindEditEvents();
  }

  document.getElementById("yo-change")?.addEventListener("click", () => {
    if (own) saveFromFields();
    localStorage.removeItem(YO_KEY);
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

function isEmpty(data) {
  return !(data.gustos?.trim() || data.pensamientos?.trim());
}

function renderEditFields() {
  return `
    <div class="notas-block">
      <label class="nosotros-subtitle" for="notas-gustos">🌷 Cosas que me gustan</label>
      <textarea id="notas-gustos" class="notas-area" rows="5"
        placeholder="Tulipanes lila, comida favorita, perritos, gatitos, música..."></textarea>
    </div>
    <div class="notas-block">
      <label class="nosotros-subtitle" for="notas-pensamientos">💭 Pensamientos</label>
      <textarea id="notas-pensamientos" class="notas-area notas-area-thought" rows="6"
        placeholder="Lo que piensas, sueñas o quieres que el otro sepa..."></textarea>
    </div>
  `;
}

function renderReadFields(data) {
  const gustos = data.gustos?.trim();
  const pens = data.pensamientos?.trim();

  return `
    <div class="notas-readonly">
      <div class="notas-read-block">
        <h3>🌷 Cosas que le gustan</h3>
        <p>${gustos ? formatText(gustos) : "<em>Sin escribir aún</em>"}</p>
      </div>
      <div class="notas-read-block thought">
        <h3>💭 Pensamientos</h3>
        <p>${pens ? formatText(pens) : "<em>Sin escribir aún</em>"}</p>
      </div>
    </div>
  `;
}

function formatText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function bindEditEvents() {
  const gustos = document.getElementById("notas-gustos");
  const pens = document.getElementById("notas-pensamientos");

  [gustos, pens].forEach((el) => {
    el?.addEventListener("input", () => {
      setSaveStatus("Guardando…", false);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveFromFields();
        setSaveStatus("Guardado 🌷", true);
      }, 350);
    });
    el?.addEventListener("blur", saveFromFields);
  });
}

function saveFromFields() {
  if (!yo || viewing !== yo) return;
  const gustos = document.getElementById("notas-gustos");
  const pens = document.getElementById("notas-pensamientos");
  if (!gustos || !pens) return;

  notas[yo] = {
    gustos: gustos.value,
    pensamientos: pens.value,
    updatedAt: new Date().toISOString(),
  };
  saveNotas();
}

/* ── Nube compartida (MantleDB) ── */
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
      diego: { ...DEFAULT_NOTAS.diego, ...remote.diego },
      bianka: { ...DEFAULT_NOTAS.bianka, ...remote.bianka },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));

    const editing = document.activeElement?.matches(".notas-area");
    if (!editing) renderNotas();
  } catch {
    /* ignore */
  }
}

export function renderNosotros(container) {
  container.innerHTML = "";
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
