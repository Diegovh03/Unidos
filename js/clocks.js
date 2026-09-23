export const TZ_PERU = "America/Lima";
export const TZ_SUECIA = "Europe/Stockholm";

export function tzParts(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
      weekday: "short",
      day: "numeric",
      month: "short",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday,
    day: parts.day,
    month: parts.month,
  };
}

function tzOffsetMs(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - date.getTime();
}

export function hoursBetweenZones(date = new Date()) {
  const diffMs = tzOffsetMs(date, TZ_SUECIA) - tzOffsetMs(date, TZ_PERU);
  return Math.round(diffMs / 3600000);
}

function setHand(el, deg) {
  if (!el) return;
  el.style.transform = `translateX(-50%) rotate(${deg}deg)`;
}

function tickOne(root, timeZone) {
  const now = new Date();
  const p = tzParts(now, timeZone);
  const hourDeg = (p.hour % 12) * 30 + p.minute * 0.5;
  const minuteDeg = p.minute * 6 + p.second * 0.1;
  const secondDeg = p.second * 6;

  setHand(root.querySelector(".hand.hour"), hourDeg);
  setHand(root.querySelector(".hand.minute"), minuteDeg);
  setHand(root.querySelector(".hand.second"), secondDeg);

  const digital = root.querySelector(".clock-digital-time");
  if (digital) {
    const hh = String(p.hour).padStart(2, "0");
    const mm = String(p.minute).padStart(2, "0");
    digital.textContent = `${hh}:${mm}`;
  }

  const dayNight = root.querySelector(".clock-daynight");
  if (dayNight) {
    dayNight.textContent = p.hour >= 6 && p.hour < 19 ? "☀️" : "🌙";
  }
}

export function clocksHtml() {
  return `
    <section class="clocks-panel card-dark anim-in" aria-label="Hora en Perú y Suecia">
      <p class="clocks-kicker">Nuestro horario ♡</p>
      <div class="clocks-row">
        <article class="clock-card" data-tz="${TZ_PERU}">
          <p class="clock-city">Perú <span aria-hidden="true">🇵🇪</span></p>
          <p class="clock-place">Lima</p>
          <div class="analog-clock" aria-hidden="true">
            <div class="clock-face">
              <span class="clock-tick"></span>
              <div class="hand hour"></div>
              <div class="hand minute"></div>
              <div class="hand second"></div>
              <div class="clock-center"></div>
            </div>
          </div>
          <p class="clock-digital"><span class="clock-digital-time">--:--</span><span class="clock-daynight" aria-hidden="true"></span></p>
        </article>
        <div class="clocks-connector" aria-hidden="true">
          <span class="clocks-connector-plane">✈️</span>
          <span class="clocks-connector-line"></span>
          <span class="clocks-connector-heart">♡</span>
        </div>
        <article class="clock-card" data-tz="${TZ_SUECIA}">
          <p class="clock-city">Suecia <span aria-hidden="true">🇸🇪</span></p>
          <p class="clock-place">Gotemburgo</p>
          <div class="analog-clock" aria-hidden="true">
            <div class="clock-face">
              <span class="clock-tick"></span>
              <div class="hand hour"></div>
              <div class="hand minute"></div>
              <div class="hand second"></div>
              <div class="clock-center"></div>
            </div>
          </div>
          <p class="clock-digital"><span class="clock-digital-time">--:--</span><span class="clock-daynight" aria-hidden="true"></span></p>
        </article>
      </div>
      <p class="clock-diff" id="clock-diff"></p>
    </section>
  `;
}

let clockTimer = null;

export function tickClocks(root = document) {
  root.querySelectorAll(".clock-card[data-tz]").forEach((card) => {
    tickOne(card, card.dataset.tz);
  });
  const diffEl = root.querySelector("#clock-diff") || document.getElementById("clock-diff");
  if (diffEl) {
    const h = hoursBetweenZones();
    diffEl.textContent = `⇄ Ahora hay ${h} hora${h === 1 ? "" : "s"} de diferencia`;
  }
}

export function startClocks(root = document) {
  stopClocks();
  tickClocks(root);
  clockTimer = setInterval(() => tickClocks(root), 1000);
}

export function stopClocks() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}
