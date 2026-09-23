import { getYo, PERSONAS } from "../cloud.js";
import { FOTO_BIANKA } from "../lugares.js";
import {
  PETS,
  RED,
  getPetsState,
  getPet,
  petLine,
  petMood,
  carePet,
  cooldownLeft,
  setSelectedPet,
  watchPetsAlerts,
} from "../pets.js";
import { staggerIn } from "../motion.js";

const ANIM_MS = {
  eat: 2400,
  bath: 2400,
  play: 2400,
  quirk: 2800,
  sleep: 3400,
};

let selected = "ringo";
let line = "";
let anim = "";
let animUntil = 0;
let tick = null;
let animTimer = null;

export function stopMascotasTick() {
  if (tick) clearInterval(tick);
  tick = null;
  if (animTimer) clearTimeout(animTimer);
  animTimer = null;
}

function barClass(n) {
  if (n < RED) return "is-low";
  if (n < 55) return "is-mid";
  return "is-ok";
}

function lastBy(stats) {
  if (!stats.by) return "";
  const p = PERSONAS[stats.by];
  return p ? `Último mimo: ${p.emoji} ${p.nombre}` : "";
}

function fxHtml(pet) {
  const isDog = pet.especie === "perrito";
  return `
    <div class="pets-fx" aria-hidden="true">
      <span class="fx-food">🍖</span>
      <span class="fx-bowl">🥣</span>
      <span class="fx-crumb c1">✨</span>
      <span class="fx-crumb c2">✨</span>
      <div class="fx-tub"></div>
      <span class="fx-drop d1">💧</span>
      <span class="fx-drop d2">💧</span>
      <span class="fx-drop d3">💧</span>
      <span class="fx-soap s1"></span>
      <span class="fx-soap s2"></span>
      <span class="fx-soap s3"></span>
      <span class="fx-soap s4"></span>
      <span class="fx-ball">${isDog ? "🎾" : "🪶"}</span>
      <span class="fx-laser"></span>
      <span class="fx-heart h1">💕</span>
      <span class="fx-heart h2">💕</span>
      <span class="fx-grass g1">🌱</span>
      <span class="fx-grass g2">🌿</span>
      <span class="fx-grass g3">🌱</span>
      <span class="fx-plate">🍽️</span>
      <span class="fx-steal">🍗</span>
      <span class="fx-paw p1">🐾</span>
      <span class="fx-paw p2">🐾</span>
      <span class="fx-moon">🌙</span>
      <span class="fx-zzz z1">Zzz</span>
      <span class="fx-zzz z2">z</span>
      <span class="fx-zzz z3">Zzz</span>
    </div>
  `;
}

function notifyHint() {
  if (!("Notification" in window)) return "";
  if (Notification.permission === "granted") {
    return `<p class="pets-foot">Si una barra llega a rojo, te llega un aviso al celular 🔔</p>`;
  }
  return `<button type="button" class="pets-notify" id="pets-notify">Activar aviso si están en rojo 🔔</button>`;
}

function renderPetCard(container, animate) {
  const state = getPetsState();
  if (!state[selected]) selected = state.selected || "ringo";
  const pet = getPet(selected);
  const stats = state[pet.id];
  const mood = petMood(stats);
  const speech = line || petLine(pet, stats);
  if (!line) line = speech;
  const yo = getYo();
  const cared = lastBy(stats);
  const scene = anim.replace("do-", "") || "idle";

  container.innerHTML = `
    <p class="pets-sub">Cada uno tiene su cosa: Ringo el pasto, Nala la comida de Bianka, Totti los masajes. Y a los tres les encanta dormirse con ella.</p>

    <div class="pets-switch" role="tablist">
      ${PETS.map((p) => {
        const s = state[p.id];
        const alert = s.hunger < RED || s.hygiene < RED || s.happy < RED;
        return `
          <button type="button" class="pets-chip ${p.id === selected ? "active" : ""}" data-pet="${p.id}">
            <img src="${p.foto}" alt="${p.nombre}" />
            <span>${p.emoji} ${p.nombre}</span>
            ${alert ? `<i class="pets-dot"></i>` : ""}
          </button>`;
      }).join("")}
    </div>

    <div class="pets-stage scene-${scene}">
      <div class="pets-bubble">${speech}</div>
      <div class="pets-hero ${anim} mood-${mood} kind-${pet.especie}" id="pets-hero">
        ${fxHtml(pet)}
        <img class="pets-bianka" src="${FOTO_BIANKA}" alt="" />
        <img class="pets-face" src="${pet.foto}" alt="${pet.nombre}" />
        <span class="pets-sparkle" aria-hidden="true">💕</span>
      </div>
      <h2 class="pets-name">${pet.emoji} ${pet.nombre}</h2>
      <p class="pets-curiosidad">${pet.curiosidad}</p>
      <p class="pets-kind">${pet.especie}${cared ? ` · ${cared}` : ""}</p>
    </div>

    <div class="pets-bars">
      ${statRow("🍖", "Hambre", stats.hunger)}
      ${statRow("🛁", "Limpieza", stats.hygiene)}
      ${statRow("🎾", "Ánimo", stats.happy)}
    </div>

    <div class="pets-actions">
      ${actionBtn("eat", "🍖", "Comer", stats)}
      ${actionBtn("bath", "🛁", "Bañar", stats)}
      ${actionBtn("play", "🎾", "Jugar", stats)}
    </div>
    <div class="pets-actions pets-actions-more">
      ${actionBtn("quirk", pet.quirkEmoji, pet.quirkLabel, stats)}
      ${actionBtn("sleep", "😴", "Dormir", stats, "is-soft")}
    </div>

    <p class="pets-foot">${yo ? `Cuidas como ${PERSONAS[yo]?.nombre || ""}` : "Elige quién eres en Perfil para firmar los mimos"}</p>
    ${notifyHint()}
  `;

  bindPets(container);
  if (animate) staggerIn(container);
  watchPetsAlerts();
}

function statRow(emoji, label, value) {
  return `
    <div class="pets-stat">
      <span>${emoji} ${label}</span>
      <div class="pets-meter"><i class="${barClass(value)}" style="width:${value}%"></i></div>
      <strong>${value}</strong>
    </div>`;
}

function actionBtn(action, emoji, label, stats, extra = "") {
  const wait = cooldownLeft(stats, action);
  const busy = wait > 0 || Date.now() < animUntil;
  const sec = Math.ceil(wait / 1000);
  return `
    <button type="button" class="pets-act ${extra}" data-act="${action}" ${busy ? "disabled" : ""}>
      <span>${emoji}</span>
      ${wait > 0 ? `Espera ${sec}s` : label}
    </button>`;
}

function bindPets(container) {
  container.querySelectorAll("[data-pet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selected = btn.dataset.pet;
      setSelectedPet(selected);
      line = "";
      anim = "";
      animUntil = 0;
      renderPetCard(container, false);
    });
  });

  container.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.act;
      const res = carePet(selected, action);
      const pet = getPet(selected);
      if (!res.ok) {
        line = `Espera un poquito… ${pet.nombre} todavía está con eso`;
        renderPetCard(container, false);
        return;
      }
      try { navigator.vibrate?.(40); } catch { /* ignore */ }
      const ms = ANIM_MS[action] || 2400;
      anim = `do-${action}`;
      animUntil = Date.now() + ms;
      line = petLine(pet, res.stats, action);
      renderPetCard(container, false);
      if (animTimer) clearTimeout(animTimer);
      animTimer = setTimeout(() => {
        anim = "";
        animUntil = 0;
        renderPetCard(container, false);
      }, ms);
    });
  });

  document.getElementById("pets-notify")?.addEventListener("click", async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (await Notification.requestPermission() !== "granted") return;
    const reg = await navigator.serviceWorker.register("./sw.js");
    await reg.ready;
    reg.active?.postMessage({ type: "SCHEDULE_NOTIFICATIONS" });
    await watchPetsAlerts();
    await reg.showNotification("Avisos de mascotas 🐾", {
      body: "Si Ringo, Totti o Nala llegan a rojo, te avisamos.",
      icon: "./icons/icon-192.png",
      tag: "pets-on",
    });
    renderPetCard(container, false);
  });
}

export function renderMascotas(container) {
  stopMascotasTick();
  const state = getPetsState();
  selected = state.selected || "ringo";
  line = "";
  anim = "";
  animUntil = 0;
  renderPetCard(container, true);
  tick = setInterval(() => {
    if (Date.now() < animUntil) return;
    if (document.getElementById("pets-hero")) renderPetCard(container, false);
  }, 4000);
}
