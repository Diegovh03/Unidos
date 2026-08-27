let frasesDelDia = [];

export async function initFrases() {
  const res = await fetch("./data/frases.json");
  frasesDelDia = await res.json();
  return frasesDelDia;
}

const ANIVERSARIO = new Date(2026, 4, 16, 3, 0, 0, 0);

export function getFraseDelDia(fromDate = new Date(), nextEvent = null) {
  if (!frasesDelDia.length) {
    return {
      texto: "Te amo sin saber cómo, ni cuándo, ni de dónde.",
      autor: "Pablo Neruda",
      icono: "🌷",
    };
  }

  const dayIndex = Math.floor((fromDate - ANIVERSARIO) / (1000 * 60 * 60 * 24));

  if (nextEvent && !nextEvent.activo && nextEvent.dias <= 7 && nextEvent.tipo === "encuentro") {
    const pool = frasesDelDia.filter((f) => f.categoria === "encuentro" || f.categoria === "distancia");
    return pool[Math.abs(dayIndex) % pool.length];
  }

  if (nextEvent && nextEvent.activo) {
    const pool = frasesDelDia.filter((f) => f.categoria === "amor" || f.categoria === "encuentro");
    return pool[Math.abs(dayIndex) % pool.length];
  }

  const idx = ((dayIndex % frasesDelDia.length) + frasesDelDia.length) % frasesDelDia.length;
  return frasesDelDia[idx];
}
