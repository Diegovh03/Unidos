import { getYo } from "./cloud.js";

const KEY = "unidos-pets";
const COOLDOWN_MS = 45 * 1000;
export const RED = 30;
const PER_HOUR = { hunger: 8, hygiene: 5, happy: 6 };

export const PETS = [
  {
    id: "ringo",
    nombre: "Ringo",
    especie: "perrito",
    emoji: "🐶",
    foto: "assets/fotos/ringo.png",
    curiosidad: "Le encanta comer pasto, aunque no debería 🌱",
    quirkLabel: "Pasto",
    quirkEmoji: "🌱",
    voz: {
      idle: ["Guau 💕", "¿Paseo?", "Hay pasto rico"],
      eat: ["¡Ñam ñam!", "Más croquetas 😋", "Ricooo"],
      bath: ["¡Agua!", "Shake shake 💦", "Ya brillo"],
      play: ["¡Pelota!", "Corre corre 🎾", "Otra vez"],
      quirk: ["Ñam pasto 🌱", "Verde y rico", "No me mires así"],
      sleep: ["Zzz con mamá Bianka", "Cama calentita", "Buenas noches 💕"],
      hungry: ["Tengo hambre 🥺", "¿Comidita?"],
      dirty: ["Estoy sucio…", "Baño please"],
      sad: ["Juega conmigo", "Te extraño"],
    },
  },
  {
    id: "totti",
    nombre: "Totti",
    especie: "gatito",
    emoji: "🐱",
    foto: "assets/fotos/totti.png",
    curiosidad: "Le da masajes en la cabeza a Bianka, a su manera 💆",
    quirkLabel: "Masaje",
    quirkEmoji: "💆",
    voz: {
      idle: ["Miau", "Pur pur 💕", "¿Cabeza?"],
      eat: ["¡Ñam!", "Atún please", "Más 😋"],
      bath: ["¡No el agua!", "Ok… ya está", "Seco ya"],
      play: ["Laser ✨", "Caza caza", "Otra vez"],
      quirk: ["Amasar amasar", "Tu cabeza es mía", "Pur en la sien 💆"],
      sleep: ["En la almohada de Bianka", "Zzz juntos", "No me muevas"],
      hungry: ["¿Mi plato?", "Hambre miau"],
      dirty: ["Lámeme… o báñame", "Polvo 😾"],
      sad: ["Regazo ahora", "Te espero"],
    },
  },
  {
    id: "nala",
    nombre: "Nala",
    especie: "gatita",
    emoji: "🐱",
    foto: "assets/fotos/nala.png",
    curiosidad: "Le roba la comida a Bianka apenas se descuida 🍽️",
    quirkLabel: "Robar",
    quirkEmoji: "🍽️",
    voz: {
      idle: ["Miau suave", "Estoy reina 👑", "¿Dejaste el plato?"],
      eat: ["Delicia", "Más pollito", "Ñam 💕"],
      bath: ["Con cuidado…", "Ya limpia ✨", "Toalla"],
      play: ["Plumita", "A cazar", "Juguemos"],
      quirk: ["Era mío 🍽️", "Bianka parpadeó", "Ñam robado"],
      sleep: ["Enredada con Bianka", "Zzz ladrona", "Su almohada es mía"],
      hungry: ["Mi cena", "Tengo hambre"],
      dirty: ["No me ves así", "Baño ya"],
      sad: ["Mimos", "Quédate"],
    },
  },
];

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyStats() {
  const now = Date.now();
  const row = { selected: "ringo", updatedAt: now, alerts: {} };
  for (const pet of PETS) {
    row[pet.id] = {
      hunger: 72,
      hygiene: 70,
      happy: 78,
      last: { eat: 0, bath: 0, play: 0, quirk: 0, sleep: 0 },
      by: null,
    };
  }
  return row;
}

function loadRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") || emptyStats();
    const base = emptyStats();
    const merged = { ...base, ...parsed, alerts: parsed.alerts || {} };
    for (const pet of PETS) {
      const s = { ...base[pet.id], ...(parsed[pet.id] || {}) };
      s.last = { ...base[pet.id].last, ...(s.last || {}) };
      merged[pet.id] = s;
    }
    return merged;
  } catch {
    return emptyStats();
  }
}

function applyDecay(current) {
  const now = Date.now();
  const hours = Math.max(0, (now - (current.updatedAt || now)) / 3600000);
  if (hours <= 0) return current;
  const next = { ...current, updatedAt: now, alerts: { ...(current.alerts || {}) } };
  for (const pet of PETS) {
    const s = { ...(next[pet.id] || emptyStats()[pet.id]) };
    s.hunger = clamp(s.hunger - hours * PER_HOUR.hunger);
    s.hygiene = clamp(s.hygiene - hours * PER_HOUR.hygiene);
    s.happy = clamp(s.happy - hours * PER_HOUR.happy);
    next[pet.id] = s;
  }
  return next;
}

let state = applyDecay(loadRaw());
save();

function snapshot() {
  return {
    updatedAt: state.updatedAt,
    alerts: state.alerts || {},
    pets: Object.fromEntries(
      PETS.map((p) => [
        p.id,
        {
          hunger: state[p.id].hunger,
          hygiene: state[p.id].hygiene,
          happy: state[p.id].happy,
          nombre: p.nombre,
          emoji: p.emoji,
          foto: p.foto,
        },
      ])
    ),
  };
}

function persistSwSnapshot() {
  const body = JSON.stringify(snapshot());
  caches.open("nuestro-plan-meta").then((cache) =>
    cache.put("pets-snapshot", new Response(body, { headers: { "Content-Type": "application/json" } }))
  ).catch(() => {});
  navigator.serviceWorker?.controller?.postMessage({ type: "PETS_SNAPSHOT", snapshot: snapshot() });
}

function save() {
  state.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
  persistSwSnapshot();
}

export function getPetsState() {
  state = applyDecay(state);
  save();
  return state;
}

export function getPet(id) {
  return PETS.find((p) => p.id === id) || PETS[0];
}

export function petMood(stats) {
  if (stats.hunger < RED) return "hungry";
  if (stats.hygiene < RED) return "dirty";
  if (stats.happy < RED) return "sad";
  return "idle";
}

export function petLine(pet, stats, action) {
  const mood = action || petMood(stats);
  const pool = pet.voz[mood] || pet.voz.idle;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function cooldownLeft(stats, action) {
  const last = stats.last?.[action] || 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

export function carePet(id, action) {
  state = applyDecay(state);
  const stats = { ...state[id] };
  const wait = cooldownLeft(stats, action);
  if (wait > 0) {
    return { ok: false, wait, state, stats };
  }

  if (action === "eat") {
    stats.hunger = clamp(stats.hunger + 38);
    stats.happy = clamp(stats.happy + 8);
  } else if (action === "bath") {
    stats.hygiene = clamp(stats.hygiene + 42);
    stats.happy = clamp(stats.happy + 6);
  } else if (action === "play") {
    stats.happy = clamp(stats.happy + 36);
    stats.hunger = clamp(stats.hunger - 6);
  } else if (action === "quirk") {
    if (id === "ringo") {
      stats.hunger = clamp(stats.hunger + 22);
      stats.happy = clamp(stats.happy + 14);
      stats.hygiene = clamp(stats.hygiene - 4);
    } else if (id === "nala") {
      stats.hunger = clamp(stats.hunger + 28);
      stats.happy = clamp(stats.happy + 18);
    } else {
      stats.happy = clamp(stats.happy + 32);
    }
  } else if (action === "sleep") {
    stats.happy = clamp(stats.happy + 28);
    stats.hunger = clamp(stats.hunger - 4);
  }

  stats.last = { ...stats.last, [action]: Date.now() };
  stats.by = getYo() || null;
  state[id] = stats;
  save();
  return { ok: true, wait: 0, state, stats };
}

export function setSelectedPet(id) {
  state.selected = id;
  save();
}

export function petsNeedCare() {
  const s = getPetsState();
  return PETS.filter((p) => {
    const st = s[p.id];
    return st.hunger < 40 || st.hygiene < 40 || st.happy < 40;
  });
}

export function redPetAlerts(current = state) {
  const out = [];
  for (const pet of PETS) {
    const s = current[pet.id];
    if (!s) continue;
    if (s.hunger < RED) {
      out.push({
        tag: `${pet.id}-hunger`,
        title: `${pet.emoji} ${pet.nombre} tiene hambre`,
        body: "Su barra está en rojo. Dale de comer en Unidos.",
        icon: `./${pet.foto}`,
      });
    }
    if (s.hygiene < RED) {
      out.push({
        tag: `${pet.id}-dirty`,
        title: `${pet.emoji} ${pet.nombre} está sucio`,
        body: "Su limpieza está en rojo. Toca Bañar.",
        icon: `./${pet.foto}`,
      });
    }
    if (s.happy < RED) {
      out.push({
        tag: `${pet.id}-sad`,
        title: `${pet.emoji} ${pet.nombre} está triste`,
        body: "Su ánimo está en rojo. Juega un rato con él.",
        icon: `./${pet.foto}`,
      });
    }
  }
  return out;
}

export async function watchPetsAlerts() {
  state = applyDecay(state);
  const today = todayKey();
  const alerts = { ...(state.alerts || {}) };
  const active = redPetAlerts(state);
  const activeTags = new Set(active.map((a) => a.tag));

  for (const tag of Object.keys(alerts)) {
    if (!activeTags.has(tag)) delete alerts[tag];
  }

  const fresh = active.filter((a) => alerts[a.tag] !== today);
  state.alerts = alerts;
  save();

  if (!fresh.length) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    for (const alert of fresh) {
      await reg.showNotification(alert.title, {
        body: alert.body,
        icon: alert.icon,
        badge: "./icons/icon-192.png",
        tag: alert.tag,
        renotify: true,
        data: { page: "mascotas" },
      });
      alerts[alert.tag] = today;
    }
    state.alerts = alerts;
    save();
  } catch {
    /* iOS a veces bloquea si no está instalada */
  }
}
