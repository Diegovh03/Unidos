import { FOTO_BIANKA, FOTO_DIEGO } from "./lugares.js";
import { PERSONAS } from "./cloud.js";

function imgHtml(src, alt) {
  return `<img src="${src}" alt="${alt}" loading="lazy" />`;
}

/** Dos fotos unidas con lazo rosa */
export async function renderCoupleRibbon(options = {}) {
  const { showDays = true, days = 0, compact = false } = options;

  const daysHtml = showDays
    ? `<p class="ribbon-days">Juntos desde <strong id="days-together">${days}</strong> días<br><span class="ribbon-since">16 de mayo de 2026 · 3:00</span></p>`
    : "";

  return `
    <div class="couple-ribbon ${compact ? "couple-ribbon-compact" : ""} anim-in">
      <button type="button" class="ribbon-photo ribbon-left ripple-btn" data-ciudad="lima" aria-label="Bianka">
        <div class="polaroid polaroid-left">
          <div class="polaroid-img">${imgHtml(FOTO_BIANKA, "Bianka")}</div>
          <span class="polaroid-cap">${PERSONAS.bianka.emoji} Bianka · Lima</span>
        </div>
      </button>

      <div class="ribbon-bind" aria-hidden="true">
        <svg class="ribbon-svg" viewBox="0 0 120 80" fill="none">
          <path class="ribbon-strand ribbon-strand-l" d="M8,40 C35,38 45,20 60,28" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="ribbon-strand ribbon-strand-r" d="M112,40 C85,38 75,20 60,28" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="ribbon-strand ribbon-tail-l" d="M60,28 C52,36 38,42 28,48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <path class="ribbon-strand ribbon-tail-r" d="M60,28 C68,36 82,42 92,48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <ellipse cx="60" cy="26" rx="14" ry="9" fill="currentColor" opacity="0.95"/>
          <circle cx="52" cy="22" r="7" fill="currentColor"/>
          <circle cx="68" cy="22" r="7" fill="currentColor"/>
          <circle cx="60" cy="30" r="4" fill="#ff6ba3"/>
        </svg>
        <span class="ribbon-heart heart-beat">💕</span>
      </div>

      <button type="button" class="ribbon-photo ribbon-right ripple-btn" data-ciudad="gotemburgo" aria-label="Diego">
        <div class="polaroid polaroid-right">
          <div class="polaroid-img">${imgHtml(FOTO_DIEGO, "Diego")}</div>
          <span class="polaroid-cap">Diego · Gotemburgo ${PERSONAS.diego.emoji}</span>
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
