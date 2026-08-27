import { initFrases } from "./frases.js";
import { renderHeader, renderHome, stopHomeTimers } from "./pages/home.js";
import { renderMapa, ensureCiudadViewer } from "./pages/mapa.js";
import { renderRecuerdos, startRecuerdosPoll } from "./pages/recuerdos.js";
import { renderDiario, startDiarioPoll } from "./pages/diario.js";
import { renderPlanes } from "./pages/planes.js";
import { renderNosotros, startNosotrosPoll, stopNosotrosPoll } from "./nosotros.js";
import { getFraseDelDia } from "./frases.js";
import { getNextEvent } from "./plan.js";
import { pageEnter, bindRipples } from "./motion.js";
import { needsOnboarding, onboardingHtml, bindOnboarding } from "./onboarding.js";

let pollTimer = null;

const container = () => document.getElementById("page-content");

async function navigate(page) {
  document.body.classList.toggle("page-home", page === "home");
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  stopNosotrosPoll();
  stopHomeTimers();

  const el = container();
  el.classList.add("page-exit");
  await new Promise((r) => setTimeout(r, 120));
  el.innerHTML = '<p class="loading pulse-dots">Cargando<span>.</span><span>.</span><span>.</span></p>';
  renderHeader(page);

  switch (page) {
    case "home":
      await renderHome(el);
      setupNotifications();
      break;
    case "recuerdos":
      await renderRecuerdos(el);
      pollTimer = startRecuerdosPoll(el);
      break;
    case "diario":
      await renderDiario(el);
      pollTimer = startDiarioPoll();
      break;
    case "planes":
      await renderPlanes(el);
      break;
    case "mapa":
      await renderMapa(el);
      break;
    case "nosotros":
      renderNosotros(el);
      startNosotrosPoll();
      break;
    default:
      await renderHome(el);
  }

  pageEnter(el);
  bindRipples(el);
  window.scrollTo(0, 0);
}

async function setupNotifications() {
  const btn = document.getElementById("notify-btn-home");
  const status = document.getElementById("notify-status");
  if (!btn) return;

  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  if (Notification.permission === "granted") {
    if (status) {
      status.hidden = false;
      status.textContent = "Notificaciones activas · 8 AM Lima";
    }
  }

  btn.onclick = async () => {
    if (await Notification.requestPermission() !== "granted") return;
    const reg = await navigator.serviceWorker.register("./sw.js");
    await reg.ready;
    reg.active?.postMessage({ type: "SCHEDULE_NOTIFICATIONS" });
    const frase = getFraseDelDia(new Date(), getNextEvent(new Date()));
    reg.showNotification("Para ti 💕", {
      body: `"${frase.texto}" — ${frase.autor}`,
      icon: "./icons/icon-192.png",
    });
    if (status) {
      status.hidden = false;
      status.textContent = "Notificaciones activas · 8 AM Lima";
    }
  };
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => navigate(btn.dataset.page));
});

bindRipples(document.querySelector(".bottom-nav"));

window.addEventListener("navigate", (e) => navigate(e.detail));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

initFrases().then(() => {
  ensureCiudadViewer();
  const start = () => navigate("home");
  if (needsOnboarding()) {
    document.body.insertAdjacentHTML("beforeend", onboardingHtml());
    bindOnboarding(start);
  } else {
    start();
  }
});
