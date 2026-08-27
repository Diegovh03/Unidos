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

export function bindRipples(root = document) {
  root.querySelectorAll(".ripple-btn, .grid-btn, .icon-btn, .fab, .nav-item, .yo-btn, .btn-pink, .btn, .plan-item").forEach((btn) => {
    if (btn.dataset.rippleBound) return;
    btn.dataset.rippleBound = "1";
    btn.classList.add("ripple-btn");
    btn.addEventListener("click", (e) => ripple(e, btn));
  });
}

export function pop(el) {
  el?.classList.remove("pop");
  void el?.offsetWidth;
  el?.classList.add("pop");
}
