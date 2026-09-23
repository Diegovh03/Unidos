import { FOTO_BIANKA, FOTO_DIEGO } from "./lugares.js";

function imgHtml(src, alt) {
  return `<img src="${src}" alt="${alt}" loading="lazy" />`;
}

/** Dos fotos unidas con lazo rosa */
export async function renderCoupleRibbon(options = {}) {
  const { showDays = true, days = 0, compact = false } = options;

  const daysHtml = showDays
    ? `<p class="ribbon-days"><strong id="days-together">${days}</strong> días juntos ♡<br><span class="ribbon-since">📅 24 de junio de 2026</span></p>`
    : "";

  return `
    <div class="couple-ribbon ${compact ? "couple-ribbon-compact" : ""} anim-in">
      <span class="ribbon-deco deco-h1" aria-hidden="true">♡</span>
      <span class="ribbon-deco deco-h2" aria-hidden="true">♡</span>
      <span class="ribbon-deco deco-sprig-r" aria-hidden="true">🌾</span>

      <button type="button" class="ribbon-photo ribbon-left ripple-btn" data-ciudad="lima" aria-label="Bianka">
        <div class="polaroid polaroid-left">
          <span class="polaroid-tape" aria-hidden="true"></span>
          <div class="polaroid-img">${imgHtml(FOTO_BIANKA, "Bianka")}</div>
          <span class="polaroid-cap">Bianka · Lima ♡</span>
        </div>
      </button>

      <div class="ribbon-bind" aria-hidden="true">
        <svg class="ribbon-svg" viewBox="0 0 120 60" fill="none">
          <path d="M6,30 C26,30 34,24 42,30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 5"/>
          <path d="M114,30 C94,30 86,24 78,30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 5"/>
          <path d="M60,44 C48,34 46,22 54,18 C58,16 60,20 60,23 C60,20 62,16 66,18 C74,22 72,34 60,44 Z" fill="currentColor"/>
        </svg>
      </div>

      <button type="button" class="ribbon-photo ribbon-right ripple-btn" data-ciudad="gotemburgo" aria-label="Diego">
        <div class="polaroid polaroid-right">
          <span class="polaroid-tape" aria-hidden="true"></span>
          <div class="polaroid-img">${imgHtml(FOTO_DIEGO, "Diego")}</div>
          <span class="polaroid-cap">Diego · Gotemburgo ♡</span>
        </div>
      </button>

      ${daysHtml}
    </div>
  `;
}

export function bindCoupleRibbon(root, onCityClick) {
  root.querySelectorAll(".ribbon-photo[data-ciudad]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (onCityClick) onCityClick(btn.dataset.ciudad);
      else window.dispatchEvent(new CustomEvent("navigate", { detail: "mapa" }));
    });
  });
}
