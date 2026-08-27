const ANIVERSARIO = new Date(2026, 4, 16, 3, 0, 0, 0);
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
    icon: "./icons/icon.svg",
    badge: "./icons/icon.svg",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("nuestro-plan-v2").then((cache) =>
      cache.addAll(["./", "./index.html", "./data/frases.json", "./icons/icon.svg"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      loadFrases(),
    ]).then(() => scheduleNextCheck())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATIONS") {
    scheduleNextCheck();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
