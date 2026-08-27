export const plan = {
  aniversario: { inicio: "2026-05-16", hora: "03:00" },

  cumpleanos: [
    { quien: "diego", mesDia: "03-03", nombre: "Diego", icono: "🐶" },
    { quien: "bianka", mesDia: "04-27", nombre: "Bianka", icono: "🐱" },
  ],

  /** A partir del día siguiente, cada día que pasa se marca con X */
  separacion: "2026-08-30",

  movimientos: [
    { fecha: "2026-08-30", quien: "tu", de: "Perú", a: "Gotemburgo", icono: "✈️" },
    { fecha: "2026-10-30", quien: "ella", de: "Lima", a: "España", icono: "✈️" },
    { fecha: "2026-11-09", quien: "tu", de: "Gotemburgo", a: "España", icono: "💕" },
  ],

  /** Días juntos: no se pinta el rango; sí se usa para no poner X */
  encuentros: [
    { inicio: "2026-05-16", fin: "2026-08-29", lugar: "Perú" },
    { inicio: "2026-11-09", fin: "2026-11-17", lugar: "España" },
    { inicio: "2027-06-15", fin: "2027-08-15", lugar: "Perú" },
  ],

  hitos: [],

  fases: [
    { id: "peru", hasta: "2026-08-29", label: "Juntos en Perú", color: "#DDA0DD" },
    { id: "suecia", desde: "2026-08-30", hasta: "2026-11-08", label: "A distancia", color: "#E6E6FA" },
    { id: "espana", desde: "2026-11-09", hasta: "2026-11-17", label: "Juntos en España", color: "#B57EDC" },
    { id: "distancia1", desde: "2026-11-18", hasta: "2027-06-14", label: "A distancia", color: "#E6E6FA" },
    { id: "lima", desde: "2027-06-15", hasta: "2027-08-15", label: "Diego en Perú", color: "#DDA0DD" },
  ],
};

export const VERSE_ESPAÑA = "2026-11-09";
export const DIEGO_PERU_INICIO = "2027-06-15";
export const DIEGO_PERU_FIN = "2027-08-15";

export function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(a, b) {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isInRange(dateStr, inicio, fin) {
  return dateStr >= inicio && dateStr <= fin;
}

export function isJuntosDay(dateStr) {
  return plan.encuentros.some((e) => isInRange(dateStr, e.inicio, e.fin));
}

export function getDayInfo(dateStr) {
  const info = { tipos: [], label: null, icono: null, labels: [] };
  const mesDia = dateStr.slice(5);

  if (mesDia === "06-24" && dateStr >= plan.aniversario.inicio) {
    info.tipos.push("aniversario");
    info.icono = "💕";
    info.labels.push("Aniversario");
  }

  for (const c of plan.cumpleanos) {
    if (mesDia === c.mesDia) {
      info.tipos.push(`cumple-${c.quien}`);
      info.tipos.push("cumple");
      if (!info.icono) info.icono = "🎂";
      info.labels.push(`Cumple de ${c.nombre} ${c.icono}`);
    }
  }

  for (const m of plan.movimientos) {
    if (m.fecha === dateStr) {
      info.tipos.push("viaje");
      info.icono = m.icono;
      info.labels.push(m.quien === "tu" ? `Tú → ${m.a}` : `Ella → ${m.a}`);
    }
  }

  for (const e of plan.encuentros) {
    if (isInRange(dateStr, e.inicio, e.fin)) {
      info.tipos.push("juntos");
      if (!info.icono) info.icono = "💕";
      info.labels.push(`Juntos en ${e.lugar}`);
    }
  }

  for (const h of plan.hitos) {
    if (h.fecha === dateStr || (h.fin && isInRange(dateStr, h.fecha, h.fin))) {
      info.tipos.push("hito");
      if (!info.icono) info.icono = h.icono;
      info.labels.push(h.titulo);
    }
  }

  info.label = info.labels[0] || null;
  return info;
}

export function getNextEvent(fromDate = new Date()) {
  const today = dateKey(fromDate);
  const events = [];

  for (const m of plan.movimientos) {
    if (m.fecha >= today) {
      events.push({
        fecha: m.fecha,
        titulo: m.quien === "tu" ? `Ir a ${m.a}` : `Ella viaja a ${m.a}`,
        tipo: "viaje",
      });
    }
  }

  for (const e of plan.encuentros) {
    if (e.inicio >= today) {
      events.push({
        fecha: e.inicio,
        titulo: `Verse en ${e.lugar}`,
        tipo: "encuentro",
        fin: e.fin,
      });
    } else if (today >= e.inicio && today <= e.fin) {
      const dayNum = daysBetween(e.inicio, today) + 1;
      const total = daysBetween(e.inicio, e.fin) + 1;
      const restantes = daysBetween(today, e.fin);
      return {
        activo: true,
        titulo: `Juntos en ${e.lugar}`,
        subtitulo: `Día ${dayNum} de ${total}`,
        restantes,
        tipo: "juntos",
      };
    }
  }

  for (const h of plan.hitos) {
    if (h.fecha >= today && !events.some((ev) => ev.fecha === h.fecha && ev.titulo === h.titulo)) {
      events.push({ fecha: h.fecha, titulo: h.titulo, tipo: "hito" });
    }
  }

  events.sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (events.length === 0) return null;

  const next = events[0];
  const dias = daysBetween(today, next.fecha);
  return {
    activo: false,
    titulo: next.titulo,
    subtitulo: formatDate(parseDate(next.fecha)),
    dias,
    tipo: next.tipo,
  };
}

export function formatDate(date) {
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildTimelineEvents() {
  const items = [];
  items.push({ fecha: plan.aniversario.inicio, titulo: "Aniversario — empezamos juntos 💕" });
  for (const m of plan.movimientos) {
    items.push({
      fecha: m.fecha,
      titulo: m.quien === "tu" ? `Tú: ${m.de} → ${m.a} ${m.icono}` : `Ella: ${m.de} → ${m.a} ${m.icono}`,
    });
  }
  for (const e of plan.encuentros) {
    items.push({ fecha: e.inicio, fin: e.fin, titulo: `Juntos en ${e.lugar} 💕` });
  }
  const seen = new Set();
  for (const h of plan.hitos) {
    const key = `${h.fecha}-${h.titulo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ fecha: h.fecha, fin: h.fin, titulo: `${h.icono} ${h.titulo}` });
  }
  items.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return items;
}

export function getDaysTogether(fromDate = new Date()) {
  const start = parseDate(plan.aniversario.inicio);
  const diff = fromDate.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/** Fechas que se colorean en el calendario (un día, no el rango) */
export function getImportantMark(dateStr) {
  if (dateStr === plan.separacion) {
    return { tipo: "salida", label: "Diego viaja a Gotemburgo", icono: "✈️" };
  }
  if (dateStr === "2026-10-30") {
    return { tipo: "viaje-ella", label: "Bianka viaja a España", icono: "✈️" };
  }
  if (dateStr === VERSE_ESPAÑA) {
    return { tipo: "verse", label: "Nos vemos en España", icono: "💕" };
  }
  if (dateStr === DIEGO_PERU_INICIO) {
    return { tipo: "peru", label: "Diego vuelve a Perú", icono: "✈️" };
  }
  if (dateStr === DIEGO_PERU_FIN) {
    return { tipo: "peru-fin", label: "Fin de la estadía en Perú", icono: "🌷" };
  }
  return null;
}

/** X automática: cada día ya pasado después del 30 de agosto, si no están juntos */
export function shouldMarkX(dateStr, todayStr = dateKey(new Date())) {
  if (dateStr <= plan.separacion) return false;
  if (dateStr >= todayStr) return false;
  if (isJuntosDay(dateStr)) return false;
  if (getImportantMark(dateStr)) return false;
  return true;
}

export function getDiasParaVernos(fromDate = new Date()) {
  const today = dateKey(fromDate);
  const encuentro = plan.encuentros.find((e) => e.lugar === "España");
  if (encuentro && today >= encuentro.inicio && today <= encuentro.fin) {
    return { estado: "juntos", lugar: "España", dias: 0, fecha: VERSE_ESPAÑA };
  }
  if (today > (encuentro?.fin || VERSE_ESPAÑA)) {
    return { estado: "pasado", dias: 0, fecha: VERSE_ESPAÑA };
  }
  return {
    estado: "falta",
    dias: daysBetween(today, VERSE_ESPAÑA),
    fecha: VERSE_ESPAÑA,
  };
}

export function getDiasDiegoPeru(fromDate = new Date()) {
  const today = dateKey(fromDate);
  if (today >= DIEGO_PERU_INICIO && today <= DIEGO_PERU_FIN) {
    return {
      estado: "en-peru",
      dias: 0,
      restantes: daysBetween(today, DIEGO_PERU_FIN),
      fecha: DIEGO_PERU_INICIO,
    };
  }
  if (today > DIEGO_PERU_FIN) {
    return { estado: "pasado", dias: 0, fecha: DIEGO_PERU_INICIO };
  }
  return {
    estado: "falta",
    dias: daysBetween(today, DIEGO_PERU_INICIO),
    fecha: DIEGO_PERU_INICIO,
  };
}

/** Lista corta de hitos para el calendario */
export function getFechasImportantes() {
  return [
    {
      id: "viaje-gote",
      tipo: "salida",
      emoji: "✈️",
      titulo: "Diego → Gotemburgo",
      detalle: "30 de agosto de 2026",
      inicio: "2026-08-30",
      fin: "2026-08-30",
    },
    {
      id: "viaje-esp",
      tipo: "viaje-ella",
      emoji: "✈️",
      titulo: "Bianka → España",
      detalle: "30 de octubre de 2026",
      inicio: "2026-10-30",
      fin: "2026-10-30",
    },
    {
      id: "juntos-espana",
      tipo: "verse",
      emoji: "💕",
      titulo: "Nos vemos en España",
      detalle: "Diego llega el 9 de noviembre de 2026",
      inicio: VERSE_ESPAÑA,
      fin: VERSE_ESPAÑA,
    },
    {
      id: "juntos-lima",
      tipo: "peru",
      emoji: "✈️",
      titulo: "Diego vuelve a Perú",
      detalle: "Quincena de junio hasta quincena de agosto 2027",
      inicio: DIEGO_PERU_INICIO,
      fin: DIEGO_PERU_FIN,
    },
  ];
}

export function formatFechaRango(inicio, fin) {
  if (inicio.length === 5) {
    const [m, d] = inicio.split("-");
    const date = new Date(2000, Number(m) - 1, Number(d));
    return date.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
  }
  if (inicio === fin) {
    return formatDate(parseDate(inicio));
  }
  const a = formatDate(parseDate(inicio));
  const b = formatDate(parseDate(fin));
  return `${a} – ${b}`;
}

/** Cuántos días juntos hay en un mes */
export function countJuntosEnMes(year, monthIndex) {
  let count = 0;
  const total = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= total; d++) {
    if (isJuntosDay(dateKey(new Date(year, monthIndex, d)))) count++;
  }
  return count;
}
