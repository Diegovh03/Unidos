import {
  getDaysTogether,
  dateKey,
  getDayInfo,
  getFechasImportantes,
  parseDate,
  getImportantMark,
  shouldMarkX,
  getDiasParaVernos,
} from "../plan.js";
import { getFraseDelDia } from "../frases.js";
import { renderCoupleRibbon, bindCoupleRibbon } from "../couple-photos.js";
import { animateNumber, staggerIn, bindRipples } from "../motion.js";
import { buildUnifiedFeed } from "../timeline.js";
import { clocksHtml, startClocks, stopClocks } from "../clocks.js";
import { downloadPlanJpg } from "../plan-export.js";
import { datesOn } from "../user-dates.js";
import { installBannerHtml, bindInstallBanner } from "../onboarding.js";
import { PETS, petsNeedCare } from "../pets.js";
import { escapeHtml } from "../cloud.js";

export { stopClocks as stopHomeTimers };

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
let viewDate = new Date();
let highlightRange = null;
let selectedCalendarDate = null;

export function renderHeader(page) {
  const header = document.getElementById("top-header");
  if (page === "home") {
    header.classList.add("hidden");
    return;
  }
  header.classList.remove("hidden");
  const titles = {
    recuerdos: "Nuestro espacio",
    diario: "Diario",
    planes: "Planes",
    mapa: "Mapa",
    nosotros: "Perfil",
    mascotas: "Mascotas",
  };
  header.innerHTML = `
    <button type="button" class="header-back" id="header-back" aria-label="Volver">‹</button>
    <h1 class="header-title">${titles[page] || ""}</h1>
    <button type="button" class="header-action" id="header-notify" aria-label="Notificaciones">🔔</button>
  `;
  document.getElementById("header-back")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: "home" }));
  });
  document.getElementById("header-notify")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: "home" }));
  });
}

function verseCopy(verse) {
  if (verse.estado === "juntos") return { num: "♥", unit: "", text: "Están juntos en España" };
  if (verse.estado === "pasado") return { num: "✓", unit: "", text: "Ya se vieron en España" };
  return {
    num: verse.dias,
    unit: verse.dias === 1 ? "día" : "días",
    text: `Faltan ${verse.dias} ${verse.dias === 1 ? "día" : "días"} para vernos`,
  };
}

function petsHomeHtml() {
  const need = petsNeedCare();
  const note = need.length
    ? `${need.map((p) => p.nombre).join(", ")} ${need.length === 1 ? "quiere" : "quieren"} mimo ♡`
    : "Ringo, Totti y Nala están bien ♡";
  return `
    <button type="button" class="pets-home anim-in ripple-btn" data-goto="mascotas">
      <div class="pets-home-faces">
        ${PETS.map((p) => `<img src="${p.foto}" alt="${p.nombre}" />`).join("")}
      </div>
      <div class="pets-home-copy">
        <strong>Nuestros peludos</strong>
        <span>${note}</span>
      </div>
      <span class="pets-home-go">🐾 Cuidar ›</span>
    </button>
  `;
}

export async function renderHome(container) {
  const frase = getFraseDelDia(new Date());
  const days = getDaysTogether(new Date());
  const ribbonHtml = await renderCoupleRibbon({ showDays: true, days });
  const verse = verseCopy(getDiasParaVernos());

  container.innerHTML = `
    <div class="home-greeting anim-in">
      <div>
        <h2 class="greeting-text">Hola, amor <span class="pink heart-wiggle">💕</span></h2>
        <p class="greeting-sub">Qué bonito tenerte aquí ♡</p>
      </div>
      <div class="greeting-actions">
        <button type="button" class="icon-btn ripple-btn" data-goto="nosotros" title="Perfil">🎁</button>
        <button type="button" class="icon-btn ripple-btn" id="notify-btn-home" title="Notificaciones">🔔</button>
      </div>
    </div>

    ${installBannerHtml()}

    ${petsHomeHtml()}

    ${clocksHtml()}

    <section class="couple-feature card-dark anim-in">
      <p class="couple-feature-kicker">Desde que somos nosotros ♡</p>
      <div id="home-ribbon-wrap">${ribbonHtml}</div>
    </section>

    <div class="hero-quote anim-in shimmer-card">
      <div class="hero-quote-bg hero-bg-shift"></div>
      <span class="quote-moon" aria-hidden="true">🌙</span>
      <span class="quote-hearts" aria-hidden="true">♡♡</span>
      <div class="hero-quote-content">
        <p class="quote-reveal">"${frase.texto}"</p>
        <span>— ${frase.autor}</span>
      </div>
    </div>

    <section class="home-recent card-dark anim-in" id="home-recent">
      <div class="home-recent-head">
        <div class="home-recent-head-left">
          <span class="home-recent-icon" aria-hidden="true">📖</span>
          <div>
            <h3>Nuestro espacio</h3>
            <p class="home-recent-sub">Nuestro collage se sigue armando…</p>
          </div>
        </div>
        <button type="button" class="home-recent-link" data-goto="recuerdos">Ver todo ›</button>
      </div>
      <div id="home-recent-feed"><p class="loading">Cargando…</p></div>
    </section>

    <div class="feature-grid-unidos">
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="recuerdos">
        <span class="grid-icon icon-bounce">💕</span>
        <span>Espacio</span>
      </button>
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="mapa">
        <span class="grid-icon icon-bounce">🗺️</span>
        <span>Mapa</span>
      </button>
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="planes">
        <span class="grid-icon icon-bounce">📋</span>
        <span>Planes</span>
      </button>
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="diario">
        <span class="grid-icon icon-bounce">📔</span>
        <span>Diario</span>
      </button>
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="mascotas">
        <span class="grid-icon icon-bounce">🐾</span>
        <span>Mascotas</span>
      </button>
      <button type="button" class="grid-btn anim-in ripple-btn" data-goto="nosotros">
        <span class="grid-icon icon-bounce">🎁</span>
        <span>Perfil</span>
      </button>
    </div>

    <details class="calendar-collapse card-dark anim-in interactive-card" open>
      <summary>📅 Calendario</summary>

      <p class="calendar-intro">Explora el mes, toca una fecha y descubre qué momento guarda. Los próximos planes te llevan directo a su día.</p>

      <ul class="calendar-events-list" id="calendar-events-list">
        ${getFechasImportantes().map((f) => `
          <li>
            <button type="button" class="calendar-event-btn ${f.tipo}"
              data-goto-date="${f.inicio}"
              data-range-end="${f.inicio === f.fin ? "" : f.fin}">
              <span class="cal-ev-emoji">${f.emoji}</span>
              <span class="cal-ev-body">
                <strong>${f.titulo}</strong>
                <span>${f.detalle}</span>
              </span>
            </button>
          </li>`).join("")}
      </ul>

      <div class="calendar-nav">
        <button type="button" id="prev-month" aria-label="Mes anterior">‹</button>
        <div class="calendar-nav-center">
          <span class="calendar-month" id="calendar-month"></span>
          <span class="calendar-month-hint" id="calendar-month-hint"></span>
        </div>
        <button type="button" id="next-month" aria-label="Mes siguiente">›</button>
      </div>
      <button type="button" class="calendar-today-btn" id="calendar-today">Ir a hoy</button>

      <div class="calendar-wrap">
        <div class="calendar-grid calendar-head" id="calendar-weekdays"></div>
        <div class="calendar-grid calendar-body" id="calendar-days"></div>
      </div>
      <div class="calendar-day-detail" id="calendar-day-detail">
        <span class="cal-detail-icon">👆</span>
        <p>Toca un día para ver qué significa</p>
      </div>
      <div class="calendar-legend">
        <span class="legend-item"><i class="legend-dot salida"></i> Diego → Gotemburgo</span>
        <span class="legend-item"><i class="legend-dot viaje-ella"></i> Bianka → España</span>
        <span class="legend-item"><i class="legend-dot verse"></i> Nos vemos</span>
        <span class="legend-item"><i class="legend-dot marked-x"></i> Día en distancia</span>
        <span class="legend-item"><i class="legend-dot date"></i> Date / plan</span>
      </div>
    </details>

    <section class="hito-countdowns anim-in">
      <article class="hito-count card-dark">
        <p class="hito-count-label">Próximo vernos</p>
        <p class="hito-count-num" id="verse-num">${typeof verse.num === "number" ? 0 : verse.num}</p>
        <p class="hito-count-unit">${verse.unit}</p>
        <p class="hito-count-text">${verse.text}</p>
      </article>
    </section>

    <button type="button" class="btn-pink btn-block download-plan-btn anim-in" id="download-plan">
      Descargar nuestro plan
    </button>

    <p class="status-ok" id="notify-status" hidden></p>
  `;

  viewDate = new Date();
  highlightRange = null;
  renderCalendar();
  showTodayDetail();
  bindHomeEvents(container);
  startClocks(container);
  bindInstallBanner();
  bindCoupleRibbon(container, (ciudad) => {
    sessionStorage.setItem("open-ciudad", ciudad);
    window.dispatchEvent(new CustomEvent("navigate", { detail: "mapa" }));
  });

  animateNumber(document.getElementById("days-together"), days);
  if (typeof verse.num === "number") {
    animateNumber(document.getElementById("verse-num"), verse.num, { duration: 1100 });
  }
  staggerIn(container);
  bindRipples(container);
  await renderHomeRecent();
}

async function renderHomeRecent() {
  const el = document.getElementById("home-recent-feed");
  if (!el) return;

  const fotos = await buildUnifiedFeed("fotos");
  el.innerHTML = `
    <div class="home-space-summary">
      <span class="home-space-summary-mark" aria-hidden="true">♡</span>
      <div>
        <strong>${fotos.length} ${fotos.length === 1 ? "recuerdo guardado" : "recuerdos guardados"}</strong>
        <p>${fotos.length ? "El collage y las fotos por mes están juntos en Espacio." : "Sube la primera foto y empieza a crear su álbum juntos."}</p>
      </div>
    </div>
  `;
}

function bindHomeEvents(container) {
  container.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.add("tap-scale");
      setTimeout(() => btn.classList.remove("tap-scale"), 200);
      window.dispatchEvent(new CustomEvent("navigate", { detail: btn.dataset.goto }));
    });
  });
  document.getElementById("download-plan")?.addEventListener("click", downloadPlanJpg);
  document.getElementById("prev-month")?.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    highlightRange = null;
    renderCalendar();
  });
  document.getElementById("next-month")?.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    highlightRange = null;
    renderCalendar();
  });

  document.getElementById("calendar-today")?.addEventListener("click", () => {
    viewDate = new Date();
    highlightRange = null;
    renderCalendar();
    showTodayDetail();
    document.querySelector(".calendar-collapse")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  container.querySelectorAll("[data-goto-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.gotoDate;
      const end = btn.dataset.rangeEnd;
      if (raw.length === 5) {
        const y = new Date().getFullYear();
        viewDate = parseDate(`${y}-${raw}`);
        highlightRange = end ? { inicio: raw, fin: end } : null;
      } else {
        viewDate = parseDate(raw);
        highlightRange = end ? { inicio: raw, fin: end } : null;
      }
      selectedCalendarDate = raw.length === 5 ? `${viewDate.getFullYear()}-${raw}` : raw;
      renderCalendar();
      showCalendarDetail(selectedCalendarDate);
      document.querySelector(".calendar-collapse")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function getDayClasses(dateStr, todayStr) {
  const mark = getImportantMark(dateStr);
  const classes = ["calendar-day"];

  if (dateStr === todayStr) classes.push("today");
  if (shouldMarkX(dateStr, todayStr)) classes.push("marked-x");
  if (mark) classes.push(`mark-${mark.tipo}`);
  if (datesOn(dateStr).length) classes.push("mark-date");

  if (highlightRange && dateStr >= highlightRange.inicio && dateStr <= highlightRange.fin) {
    classes.push("in-range");
  }

  return { classes, mark };
}

function showTodayDetail() {
  const todayStr = dateKey(new Date());
  showCalendarDetail(todayStr, true);
}

function showCalendarDetail(dateStr, isToday = false) {
  selectedCalendarDate = dateStr;
  const info = getDayInfo(dateStr);
  const detail = document.getElementById("calendar-day-detail");
  const { icon, text } = formatDayDetail(dateStr, info);
  if (detail) {
    const rawTitle = isToday ? "Hoy" : new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
    const title = rawTitle.charAt(0).toLocaleUpperCase("es-PE") + rawTitle.slice(1);
    const body = text.replace(/^.*?:\s*/, "");
    detail.innerHTML = `<span class="cal-detail-icon" aria-hidden="true">${icon}</span><div class="cal-detail-copy"><span class="cal-detail-kicker">${isToday ? "TU DÍA" : "DÍA SELECCIONADO"}</span><strong class="cal-detail-title">${escapeHtml(title)}</strong><p>${escapeHtml(body || "Un día más para guardar en su historia.")}</p></div>`;
  }
  document.querySelectorAll(".calendar-day.selected").forEach((el) => {
    el.classList.remove("selected");
    el.setAttribute("aria-label", el.getAttribute("aria-label").replace(", seleccionado", ""));
  });
  const cell = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
  if (cell) {
    cell.classList.add("selected");
    cell.setAttribute("aria-label", `${cell.getAttribute("aria-label")}, seleccionado`);
  }
}

function formatDayDetail(dateStr, info) {
  const d = new Date(dateStr + "T12:00:00");
  const fecha = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const mark = getImportantMark(dateStr);
  const user = datesOn(dateStr);
  const extra = user.length
    ? user.map((x) => `${x.hora ? x.hora + " · " : ""}${x.titulo}`).join(" · ")
    : "";
  if (mark && extra) return { icon: "💕", text: `${fecha}: ${mark.label} · ${extra}` };
  if (mark) return { icon: mark.icono, text: `${fecha}: ${mark.label}` };
  if (extra) return { icon: "💕", text: `${fecha}: ${extra}` };
  if (shouldMarkX(dateStr)) return { icon: "✕", text: `${fecha} — día en distancia` };
  if (!info.labels.length) return { icon: "📅", text: `${fecha}` };
  return { icon: info.icono || "💕", text: `${fecha}: ${info.labels.join(" · ")}` };
}

function bindCalendarDayClicks() {
  document.querySelectorAll(".calendar-day[data-date]").forEach((cell) => {
    cell.addEventListener("click", () => showCalendarDetail(cell.dataset.date, cell.dataset.date === dateKey(new Date())));
  });
}

function renderCalendar() {
  const monthEl = document.getElementById("calendar-month");
  if (!monthEl) return;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = dateKey(new Date());

  monthEl.textContent = viewDate.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  const hint = document.getElementById("calendar-month-hint");
  if (hint) hint.textContent = "";

  document.getElementById("calendar-weekdays").innerHTML = WEEKDAYS.map(
    (d) => `<div class="calendar-weekday">${d}</div>`
  ).join("");

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let html = "";

  for (let i = 0; i < startOffset; i++) html += `<div class="calendar-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = dateKey(new Date(year, month, day));
    const { classes, mark } = getDayClasses(dateStr, todayStr);
    const xHtml = shouldMarkX(dateStr, todayStr) ? `<span class="past-x" aria-hidden="true"></span>` : "";
    const user = datesOn(dateStr);
    const iconHtml = mark
      ? `<span class="day-icon" aria-hidden="true">${mark.icono}</span>`
      : user.length
        ? `<span class="day-icon" aria-hidden="true">💕</span>`
        : "";
    const selected = dateStr === selectedCalendarDate;
    const eventLabel = mark?.label || user.map((event) => event.titulo).join(", ");
    const ariaLabel = `${new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}${eventLabel ? `: ${eventLabel}` : ""}${dateStr === todayStr ? ", hoy" : ""}`;
    html += `<button type="button" class="${classes.join(" ")}${selected ? " selected" : ""}" data-date="${dateStr}" aria-label="${escapeHtml(`${ariaLabel}${selected ? ", seleccionado" : ""}`)}"${dateStr === todayStr ? ' aria-current="date"' : ""}>${xHtml}${iconHtml}<span class="day-num">${day}</span></button>`;
  }
  document.getElementById("calendar-days").innerHTML = html;
  bindCalendarDayClicks();
}
