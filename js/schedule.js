import { hoursBetweenZones, tzParts, TZ_PERU } from "./clocks.js";

const VIEWS = [
  { id: "office", label: "Lun · Mar · Jue", cute: "Oficina 💼" },
  { id: "tele", label: "Mié · Vie", cute: "Tele juntos 💕" },
  { id: "sat", label: "Sábado", cute: "Sábado 🌊" },
  { id: "sun", label: "Domingo", cute: "Domingo ☀️" },
];

function todayView() {
  const map = { Sun: "sun", Mon: "office", Tue: "office", Wed: "tele", Thu: "office", Fri: "tele", Sat: "sat" };
  return map[tzParts(new Date(), TZ_PERU).weekday] || "office";
}

function line(time, text, heart = false) {
  return `<li class="${heart ? "is-heart" : ""}"><span class="sch-time">${time}</span><span>${text}</span></li>`;
}

function content(view, diffH) {
  if (view === "office") {
    return {
      note: `Lunes, martes y jueves. Bianka se levanta a las 6:00 y entra a las 7:30 hasta las 17:30 (Perú). Diego trabaja 8:00–16:30 (Suecia).`,
      bianka: [
        line("6:00", "Se despierta 🐱"),
        line("7:30 – 17:30", "Trabajo (entra 7:30, sale 5:30 pm)"),
        line("después", "Tarde/noche libre en Lima"),
      ],
      diego: [
        line("8:00 – 16:30", "Trabajo (sale 4:30 pm) 🐶"),
        line("después", "Tarde libre en Gotemburgo"),
      ],
      together: `El cruce es cortito estos días (${diffH} h de diferencia). Mejor un mensaje a la hora del almuerzo de Diego o un date en Planes.`,
    };
  }
  if (view === "tele") {
    return {
      note: `Miércoles y viernes: Bianka teletrabaja 9:00–17:00 y es flexible. Diego puede teletrabajar desde las 12:00. Ahí se abre la ventana para verse.`,
      bianka: [
        line("9:00 – 17:00", "Teletrabajo desde casa (flexible)", true),
        line("9:00", "Se prende la cámara ✨"),
      ],
      diego: [
        line("8:00 – 12:00", "Oficina / mañana"),
        line("12:00 →", "Puede teletrabajar", true),
        line("16:00", `Ella son las 9:00 en Perú · videollamada 💕`, true),
      ],
      together: `Videollamada rica: 9:00–12:00 Perú = ${String(9 + diffH).padStart(2, "0")}:00–${String(12 + diffH).padStart(2, "0")}:00 Suecia, los dos en tele.`,
    };
  }
  if (view === "sat") {
    return {
      note: `Sábado de Diego: pileta, compras y casita.`,
      bianka: [
        line("mañana", "Ritmo suave en Lima 🐱"),
        line("tarde", "Buen momento para escribirse o una llamada"),
      ],
      diego: [
        line("10:00 – 11:30", "A nadar 🏊"),
        line("11:30 – 13:00", "Compras y vuelta a casa"),
        line("13:00 – 21:00", "Tiempo libre (si no sale) ☕", true),
      ],
      together: `Desde la 1 pm él ya está en casa hasta las 9 pm. En Perú eso es la mañana/mediodía — un hueco lindo para hablar.`,
    };
  }
  return {
    note: `Domingo: gym, compras de la semana y tarde libre.`,
    bianka: [
      line("mañana", "Despacio en Lima 🐱"),
      line("desde 7:00", "En Perú ya es su tarde cuando él sale del gym"),
    ],
    diego: [
      line("9:00 – 10:30", "Gym 💪"),
      line("10:30 – 14:00", "Compras para la semana"),
      line("14:00 →", "Libre el resto del día", true),
    ],
    together: `A partir de las 2 pm Suecia está libre. En Perú es la mañana — cine virtual, llamada larga o planear la semana 💕`,
  };
}

export function scheduleHtml(selectedView) {
  const view = VIEWS.some((v) => v.id === selectedView) ? selectedView : todayView();
  const diffH = hoursBetweenZones();
  const c = content(view, diffH);
  const meta = VIEWS.find((v) => v.id === view);

  return `
    <section class="schedule-panel cute-sch anim-in" id="schedule-panel" data-view="${view}">
      <div class="schedule-head">
        <h3>Nuestro día 💌</h3>
        <p class="schedule-diff">${diffH} h · Lima ↔ Gotemburgo</p>
      </div>
      <div class="schedule-days sch-pills" role="tablist">
        ${VIEWS.map((v) => `
          <button type="button" class="schedule-day ${v.id === view ? "active" : ""} ${v.id === todayView() ? "is-today" : ""}" data-view="${v.id}">${v.label}</button>
        `).join("")}
      </div>
      <p class="sch-cute-title">${meta.cute}</p>
      <p class="schedule-note">${c.note}</p>
      <div class="sch-two">
        <article class="sch-col card-soft">
          <h4>🐱 Bianka · Perú</h4>
          <ul>${c.bianka.join("")}</ul>
        </article>
        <article class="sch-col card-soft">
          <h4>🐶 Diego · Suecia</h4>
          <ul>${c.diego.join("")}</ul>
        </article>
      </div>
      <div class="sch-together">${c.together}</div>
      <button type="button" class="btn-gcal" id="gcal-rutina">Añadir rutina a Google Calendar 📅</button>
    </section>
  `;
}

export function bindSchedule(root) {
  const panel = root.querySelector("#schedule-panel");
  if (!panel) return;
  panel.querySelectorAll(".schedule-day").forEach((btn) => {
    btn.addEventListener("click", () => {
      panel.outerHTML = scheduleHtml(btn.dataset.view);
      bindSchedule(root);
    });
  });
  panel.querySelector("#gcal-rutina")?.addEventListener("click", async () => {
    const { downloadRutinaIcs } = await import("./gcal.js");
    downloadRutinaIcs();
  });
}
