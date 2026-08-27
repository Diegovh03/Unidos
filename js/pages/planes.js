import { cloudGet, cloudSet, escapeHtml, getYo, uid } from "../cloud.js";
import { getNextEvent, formatDate, parseDate } from "../plan.js";
import { pop, staggerIn } from "../motion.js";
import { googleCalUrl, downloadRutinaIcs } from "../gcal.js";
import { getUserDates, addUserDate, removeUserDate, toggleUserDateDone } from "../user-dates.js";

const QUIEN = {
  ambos: { label: "Los dos", emoji: "💕" },
  diego: { label: "Diego", emoji: "🐶" },
  bianka: { label: "Bianka", emoji: "🐱" },
};

let data = {
  checklist: [
    { id: "1", text: "Comprar vuelos", done: false, icon: "✈️" },
    { id: "2", text: "Reservar hotel / lugar", done: false, icon: "🏨" },
    { id: "3", text: "Lugares para visitar", done: false, icon: "📍" },
  ],
};

let tab = "dates";

export async function loadPlanes() {
  const remote = await cloudGet("planes");
  if (remote?.checklist) data.checklist = remote.checklist;
  else {
    const local = localStorage.getItem("planes-cache");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.checklist) data.checklist = parsed.checklist;
      } catch { /* ignore */ }
    }
  }
}

async function savePlanes() {
  localStorage.setItem("planes-cache", JSON.stringify(data));
  await cloudSet("planes", data);
}

function dateLabel(d) {
  const f = formatDate(parseDate(d.fecha));
  const who = QUIEN[d.quien] || QUIEN.ambos;
  return `${f}${d.hora ? ` · ${d.hora}` : ""} · ${who.emoji} ${who.label}`;
}

export async function renderPlanes(container) {
  await loadPlanes();
  const dates = getUserDates();
  const upcoming = dates.filter((d) => !d.done);
  const doneDates = dates.filter((d) => d.done);
  const event = getNextEvent(new Date());

  container.innerHTML = `
    <div class="plan-tabs anim-in">
      <button type="button" class="plan-tab ${tab === "dates" ? "active" : ""}" data-tab="dates">Dates</button>
      <button type="button" class="plan-tab ${tab === "pendientes" ? "active" : ""}" data-tab="pendientes">Pendientes</button>
      <button type="button" class="plan-tab ${tab === "completados" ? "active" : ""}" data-tab="completados">Hechos</button>
    </div>

    ${tab === "dates" ? `
      ${event && !event.activo ? `
        <div class="plan-item card-dark anim-in">
          <span class="plan-icon">💕</span>
          <div class="plan-body">
            <strong>${escapeHtml(event.titulo)}</strong>
            <span>${event.subtitulo} · ${event.dias} días</span>
          </div>
        </div>` : ""}

      <ul class="plan-list" id="plan-list">
        ${upcoming.length ? upcoming.map((d) => `
          <li class="plan-item card-dark anim-in">
            <span class="plan-icon">${QUIEN[d.quien]?.emoji || "💕"}</span>
            <div class="plan-body">
              <strong>${escapeHtml(d.titulo)}</strong>
              <span>${dateLabel(d)}</span>
              ${d.notas ? `<span class="plan-notes">${escapeHtml(d.notas)}</span>` : ""}
            </div>
            <a class="gcal-mini" href="${googleCalUrl(d, d.quien === "diego" ? "Europe/Stockholm" : "America/Lima")}" target="_blank" rel="noopener">Google Calendar</a>
            <button type="button" class="check-circle" data-date-id="${d.id}" aria-label="Hecho"></button>
            <button type="button" class="date-del" data-del="${d.id}" aria-label="Borrar">×</button>
          </li>`).join("") : `<li class="empty-state">Aún no hay dates. Agregá uno abajo y sale en el calendario.</li>`}
      </ul>

      <div class="card-dark" id="add-plan-panel">
        <h3 class="section-label">Agregar date o plan</h3>
        <form id="date-form" class="cita-form">
          <input type="text" id="date-titulo" class="input-dark" placeholder="Ej. película, cena virtual, llamada…" maxlength="80" required />
          <input type="date" id="date-fecha" class="input-dark" required />
          <input type="time" id="date-hora" class="input-dark" />
          <select id="date-quien" class="input-dark">
            <option value="ambos">💕 Los dos</option>
            <option value="diego">🐶 Plan de Diego</option>
            <option value="bianka">🐱 Plan de Bianka</option>
          </select>
          <textarea id="date-notas" class="input-dark" rows="2" placeholder="Notas (zona horaria, idea, link…)" maxlength="300"></textarea>
          <button type="submit" class="btn-pink btn-block">Guardar y poner en el calendario</button>
        </form>
        <button type="button" class="btn-gcal" id="gcal-export-dates">Exportar dates + rutina a Google Calendar (.ics)</button>
      </div>
    ` : ""}

    ${tab === "pendientes" || tab === "completados" ? `
      <ul class="plan-list">
        ${data.checklist.filter((c) => tab === "completados" ? c.done : !c.done).map((item) => `
          <li class="plan-item card-dark anim-in ${item.done ? "done" : ""}">
            <span class="plan-icon">${item.icon || "📋"}</span>
            <div class="plan-body"><strong>${escapeHtml(item.text)}</strong></div>
            <button type="button" class="check-circle ${item.done ? "checked" : ""}" data-id="${item.id}"></button>
          </li>`).join("") || `<li class="empty-state">Nada aquí aún</li>`}
      </ul>
      ${tab === "pendientes" ? `
        <form class="add-row card-dark" id="add-check">
          <input type="text" class="input-dark" placeholder="Pendiente (vuelos, trámite…)" maxlength="100" />
          <button type="submit" class="btn-pink btn-sm">+</button>
        </form>` : ""}
    ` : ""}

    ${tab === "completados" && doneDates.length ? `
      <ul class="plan-list">
        ${doneDates.map((d) => `
          <li class="plan-item card-dark done">
            <span class="plan-icon">${QUIEN[d.quien]?.emoji || "💕"}</span>
            <div class="plan-body">
              <strong>${escapeHtml(d.titulo)}</strong>
              <span>${dateLabel(d)}</span>
            </div>
            <button type="button" class="check-circle checked" data-date-id="${d.id}"></button>
          </li>`).join("")}
      </ul>` : ""}

    <button type="button" class="fab" id="planes-fab">+</button>
  `;

  bindPlanesEvents(container);
  staggerIn(container);
}

function bindPlanesEvents(container) {
  container.querySelectorAll(".plan-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.tab;
      renderPlanes(container);
    });
  });

  container.querySelectorAll(".check-circle[data-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = data.checklist.find((x) => x.id === btn.dataset.id);
      if (item) {
        item.done = !item.done;
        pop(btn);
        await savePlanes();
        renderPlanes(container);
      }
    });
  });

  container.querySelectorAll("[data-date-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleUserDateDone(btn.dataset.dateId);
      renderPlanes(container);
    });
  });

  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeUserDate(btn.dataset.del);
      renderPlanes(container);
    });
  });

  document.getElementById("planes-fab")?.addEventListener("click", () => {
    tab = "dates";
    renderPlanes(container);
    setTimeout(() => document.getElementById("add-plan-panel")?.scrollIntoView({ behavior: "smooth" }), 50);
  });

  document.getElementById("add-check")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    data.checklist.push({ id: uid(), text, done: false, icon: "📋" });
    await savePlanes();
    renderPlanes(container);
  });

  document.getElementById("gcal-export-dates")?.addEventListener("click", downloadRutinaIcs);

  document.getElementById("date-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = document.getElementById("date-titulo").value.trim();
    const fecha = document.getElementById("date-fecha").value;
    if (!titulo || !fecha) return;
    addUserDate({
      titulo,
      fecha,
      hora: document.getElementById("date-hora").value,
      quien: document.getElementById("date-quien").value,
      notas: document.getElementById("date-notas").value.trim(),
      by: getYo() || "diego",
    });
    renderPlanes(container);
  });
}
