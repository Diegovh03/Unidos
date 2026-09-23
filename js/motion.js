/** Animaciones y micro-interacciones compartidas */

export function animateNumber(el, target, opts = {}) {
  if (!el || target == null || Number.isNaN(Number(target))) return;
  const to = Math.round(Number(target));
  const from = opts.from ?? 0;
  const duration = opts.duration ?? 900;
  const fmt = opts.format ?? ((n) => String(n));
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    const val = Math.round(from + (to - from) * eased);
    el.textContent = fmt(val);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(to);
  }
  requestAnimationFrame(tick);
}

export function staggerIn(container, selector = ".anim-in", baseDelay = 0.06) {
  container?.querySelectorAll(selector).forEach((el, i) => {
    el.style.animationDelay = `${i * baseDelay}s`;
    el.classList.add("anim-play");
  });
}

export function pageEnter(container) {
  if (!container) return;
  container.classList.remove("page-exit");
  container.classList.add("page-enter");
  staggerIn(container);
}

export function ripple(e, el) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const rippleEl = document.createElement("span");
  rippleEl.className = "ripple";
  rippleEl.style.width = rippleEl.style.height = `${size}px`;
  rippleEl.style.left = `${e.clientX - rect.left - size / 2}px`;
  rippleEl.style.top = `${e.clientY - rect.top - size / 2}px`;
  el.classList.add("has-ripple");
  el.appendChild(rippleEl);
  rippleEl.addEventListener("animationend", () => rippleEl.remove());
}

/** Elementos que llevan foto: el destello se ve mal encima, usan zoom en su lugar (ver CSS). */
const NO_RIPPLE = ".mosaic-item, .recuerdos-item, .collage-item, .collage-note, .mini-collage-item";

const RIPPLE_TARGETS = [
  ".ripple-btn", ".grid-btn", ".icon-btn", ".fab", ".nav-item", ".yo-btn",
  ".btn-pink", ".btn", ".btn-outline", ".plan-item", ".espacio-tab",
  ".recuerdos-cat-btn", ".momento-destino-btn", ".momento-categoria-btn",
  ".espacio-export-btn", ".espacio-load-more", ".home-recent-link",
  ".pets-home", ".momento-slot-edit", ".modal-close", ".install-dismiss",
  ".calendar-event-btn", ".calendar-today-btn", ".header-back", ".header-action",
].join(", ");

/** Vibración cortita al tocar (Android; en iPhone simplemente no hace nada). */
function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch { /* ignorar */ }
}

export function bindRipples(root = document) {
  root.querySelectorAll(RIPPLE_TARGETS).forEach((btn) => {
    if (btn.dataset.rippleBound) return;
    if (btn.matches(NO_RIPPLE)) return;
    btn.dataset.rippleBound = "1";
    btn.classList.add("ripple-btn");
    btn.addEventListener("click", (e) => {
      ripple(e, btn);
      haptic();
    });
  });

  root.querySelectorAll(NO_RIPPLE).forEach((el) => {
    if (el.dataset.hapticBound) return;
    el.dataset.hapticBound = "1";
    el.addEventListener("click", () => haptic());
  });
}

/** Corazoncitos que salen volando desde un punto (botón central). */
export function heartBurst(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "heart-burst";
    heart.textContent = i % 2 === 0 ? "♥" : "♡";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.color = i % 2 === 0 ? "#d2453f" : "#d98c9a";
    heart.style.setProperty("--dx", `${(i - (count - 1) / 2) * 20}px`);
    heart.style.setProperty("--dy", `${-40 - Math.random() * 30}px`);
    heart.style.setProperty("--rot", `${(Math.random() - 0.5) * 60}deg`);
    heart.style.animationDelay = `${i * 0.04}s`;
    document.body.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }
}

export function pop(el) {
  el?.classList.remove("pop");
  void el?.offsetWidth;
  el?.classList.add("pop");
}
