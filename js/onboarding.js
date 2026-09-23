import { getYo, setYo } from "./cloud.js";

const KEY = "unidos-onboarded";

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function needsOnboarding() {
  return !localStorage.getItem(KEY) || !getYo();
}

export function markOnboarded() {
  localStorage.setItem(KEY, "1");
}

export function onboardingHtml() {
  const stepYo = !getYo();
  return `
    <div class="onboard-overlay" id="onboard">
      <div class="onboard-card">
        <p class="onboard-kicker">Unidos</p>
        <h2>Nuestra app 💕</h2>
        <p class="onboard-lead">Calendario, horarios Lima ↔ Gotemburgo, dates y recuerdos. Solo para ustedes dos.</p>
        ${stepYo ? `
          <p class="onboard-q">¿Quién eres?</p>
          <div class="onboard-yo">
            <button type="button" class="yo-btn" data-yo="diego">🐶 Soy Diego</button>
            <button type="button" class="yo-btn" data-yo="bianka">🐱 Soy Bianka</button>
          </div>
        ` : `
          <ol class="onboard-steps">
            <li>Ábrela en <strong>Safari</strong> (iPhone)</li>
            <li>Toca <strong>Compartir</strong></li>
            <li><strong>Agregar a pantalla de inicio</strong></li>
          </ol>
          <p class="onboard-url">diegovh03.github.io/Unidos</p>
          <button type="button" class="btn-pink btn-block" id="onboard-done">Entrar a la app</button>
        `}
      </div>
    </div>
  `;
}

export function bindOnboarding(onDone) {
  document.body.classList.add("onboarding");
  const root = document.getElementById("onboard");
  if (!root) return;
  root.querySelectorAll("[data-yo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setYo(btn.dataset.yo);
      root.outerHTML = onboardingHtml();
      bindOnboarding(onDone);
    });
  });
  document.getElementById("onboard-done")?.addEventListener("click", () => {
    markOnboarded();
    document.body.classList.remove("onboarding");
    document.getElementById("onboard")?.remove();
    onDone?.();
  });
}

export function installBannerHtml() {
  if (isStandalone() || localStorage.getItem("unidos-hide-install")) return "";
  const copy = isIos()
    ? `Para entrar como app: Safari → Compartir → <strong>Agregar a pantalla de inicio</strong>.`
    : `Para usarla como app: en el menú del navegador elige <strong>Instalar app</strong> o <strong>Agregar a la pantalla de inicio</strong>.`;
  return `
    <div class="install-banner anim-in" id="install-banner">
      <span class="install-banner-icon" aria-hidden="true">📱</span>
      <p>${copy}</p>
      <button type="button" class="install-dismiss" id="install-dismiss" aria-label="Cerrar">×</button>
    </div>`;
}

export function bindInstallBanner() {
  document.getElementById("install-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("unidos-hide-install", "1");
    document.getElementById("install-banner")?.remove();
  });
}
