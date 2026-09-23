const ANIVERSARIO = new Date(2026, 5, 24);
const NOTIFY_HOUR_LIMA = 8;
const FRASES_URL = "./data/frases.json";

let frasesCache = null;

async function loadFrases() {
  if (frasesCache) return frasesCache;
  try {
    const res = await fetch(FRASES_URL);
    frasesCache = await res.json();
  } catch {
    frasesCache = [];
  }
  return frasesCache;
}

function getFraseForDate(date, frases) {
  const dayIndex = Math.floor((date - ANIVERSARIO) / (1000 * 60 * 60 * 24));
  if (!frases.length) {
    return { texto: "Te amo sin saber cómo, ni cuándo, ni de dónde.", autor: "Pablo Neruda" };
  }
  const idx = ((dayIndex % frases.length) + frases.length) % frases.length;
  return frases[idx];
}

function getLimaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
  };
}

function todayKeyLima() {
  const p = getLimaDateParts();
  return `${p.year}-${p.month}-${p.day}`;
}

async function showDailyNotification() {
  const frases = await loadFrases();
  const frase = getFraseForDate(new Date(), frases);
  await self.registration.showNotification("Para ti 🌷", {
    body: `"${frase.texto}" — ${frase.autor}`,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: "nuestro-plan-daily",
    renotify: true,
  });
}

function scheduleNextCheck() {
  setTimeout(checkAndNotify, 60 * 1000);
}

async function checkAndNotify() {
  const lima = getLimaDateParts();
  const lastSent = await getLastSentDate();

  if (lima.hour === NOTIFY_HOUR_LIMA && lima.minute < 5) {
    const today = todayKeyLima();
    if (lastSent !== today) {
      await showDailyNotification();
      await setLastSentDate(today);
    }
  }

  await checkPetAlerts().catch(() => {});
  scheduleNextCheck();
}

function getLastSentDate() {
  return new Promise((resolve) => {
    caches.open("nuestro-plan-meta").then(async (cache) => {
      const res = await cache.match("last-notify-date");
      if (res) resolve(await res.text());
      else resolve(null);
    }).catch(() => resolve(null));
  });
}

function setLastSentDate(dateStr) {
  return caches.open("nuestro-plan-meta").then((cache) =>
    cache.put("last-notify-date", new Response(dateStr))
  );
}

const PET_DECAY = { hunger: 8, hygiene: 5, happy: 6 };
const PET_RED = 30;

async function readPetSnapshot() {
  try {
    const cache = await caches.open("nuestro-plan-meta");
    const res = await cache.match("pets-snapshot");
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function writePetSnapshot(data) {
  try {
    const cache = await caches.open("nuestro-plan-meta");
    await cache.put("pets-snapshot", new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    }));
  } catch { /* ignore */ }
}

function clampPet(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

async function checkPetAlerts() {
  const snap = await readPetSnapshot();
  if (!snap?.pets) return;
  const now = Date.now();
  const hours = Math.max(0, (now - (snap.updatedAt || now)) / 3600000);
  const today = todayKeyLima();
  const alerts = { ...(snap.alerts || {}) };
  let dirty = false;

  for (const [id, pet] of Object.entries(snap.pets)) {
    pet.hunger = clampPet(pet.hunger - hours * PET_DECAY.hunger);
    pet.hygiene = clampPet(pet.hygiene - hours * PET_DECAY.hygiene);
    pet.happy = clampPet(pet.happy - hours * PET_DECAY.happy);
    const checks = [
      [pet.hunger < PET_RED, `${id}-hunger`, `${pet.emoji || "🐾"} ${pet.nombre} tiene hambre`, "Su barra está en rojo. Dale de comer en Unidos."],
      [pet.hygiene < PET_RED, `${id}-dirty`, `${pet.emoji || "🐾"} ${pet.nombre} está sucio`, "Su limpieza está en rojo. Toca Bañar."],
      [pet.happy < PET_RED, `${id}-sad`, `${pet.emoji || "🐾"} ${pet.nombre} está triste`, "Su ánimo está en rojo. Juega un rato."],
    ];
    for (const [isRed, tag, title, body] of checks) {
      if (!isRed) {
        if (alerts[tag]) {
          delete alerts[tag];
          dirty = true;
        }
        continue;
      }
      if (alerts[tag] === today) continue;
      await self.registration.showNotification(title, {
        body,
        icon: pet.foto ? `./${pet.foto}` : "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag,
        renotify: true,
        data: { page: "mascotas" },
      });
      alerts[tag] = today;
      dirty = true;
    }
  }

  snap.updatedAt = now;
  snap.alerts = alerts;
  if (hours > 0 || dirty) await writePetSnapshot(snap);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("unidos-v8").then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./css/styles.css",
        "./js/app.js",
        "./data/frases.json",
        "./icons/icon-192.png",
        "./icons/apple-touch-icon.png",
        "./manifest.json",
      ]).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== "unidos-v8" && k !== "nuestro-plan-meta").map((k) => caches.delete(k)))),
      loadFrases(),
    ]).then(() => {
      checkPetAlerts();
      scheduleNextCheck();
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        if (res.ok && new URL(event.request.url).origin === self.location.origin) {
          caches.open("unidos-v8").then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATIONS") {
    scheduleNextCheck();
  }
  if (event.data?.type === "PETS_SNAPSHOT" && event.data.snapshot) {
    event.waitUntil(writePetSnapshot(event.data.snapshot));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const goPets = event.notification.data?.page === "mascotas" || /-(hunger|dirty|sad)$/.test(event.notification.tag || "");
  const url = goPets ? "./?pets=1" : "./index.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].postMessage({ type: "OPEN_PAGE", page: goPets ? "mascotas" : "home" });
        return clients[0].focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
