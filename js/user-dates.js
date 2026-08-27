const KEY = "unidos-dates";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function getUserDates() {
  return load().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

export function datesOn(dateStr) {
  return getUserDates().filter((d) => d.fecha === dateStr);
}

export function addUserDate({ titulo, fecha, hora, quien, notas }) {
  const items = load();
  const item = {
    id: crypto.randomUUID(),
    titulo,
    fecha,
    hora: hora || "",
    quien: quien || "ambos",
    notas: notas || "",
    done: false,
    created: new Date().toISOString(),
  };
  items.push(item);
  save(items);
  return item;
}

export function removeUserDate(id) {
  save(load().filter((d) => d.id !== id));
}

export function toggleUserDateDone(id) {
  const items = load().map((d) => (d.id === id ? { ...d, done: !d.done } : d));
  save(items);
}
