import { downloadBytes } from "./zip.js";
import { getUserDates } from "./user-dates.js";

function stamp(dateStr, time = "00:00") {
  const [h, m] = (time || "00:00").split(":");
  return `${dateStr.replace(/-/g, "")}T${h.padStart(2, "0")}${m.padStart(2, "0")}00`;
}

function addHour(dateStr, time, hours = 1) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = (time || "00:00").split(":").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  dt.setUTCHours(dt.getUTCHours() + hours);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00`;
}

export function googleCalUrl(d, tz = "America/Lima") {
  const title = encodeURIComponent(`${d.titulo} 💕`);
  const details = encodeURIComponent(d.notas || "Plan de Unidos · Diego y Bianka");
  let dates;
  if (d.hora) {
    dates = `${stamp(d.fecha, d.hora)}/${addHour(d.fecha, d.hora, 1)}`;
  } else {
    const next = d.fecha.replace(/-/g, "");
    const [y, m, day] = d.fecha.split("-").map(Number);
    const n = new Date(y, m - 1, day + 1);
    const pad = (x) => String(x).padStart(2, "0");
    const end = `${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}`;
    dates = `${next}/${end}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&ctz=${encodeURIComponent(tz)}`;
}

function fold(s) {
  return s.replace(/\n/g, "\\n");
}

function vevent({ uid, summary, description, dtstart, dtend, rrule, tzid }) {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SUMMARY:${fold(summary)}`,
    description ? `DESCRIPTION:${fold(description)}` : "",
    `DTSTART;TZID=${tzid}:${dtstart}`,
    `DTEND;TZID=${tzid}:${dtend}`,
    rrule ? `RRULE:${rrule}` : "",
    "END:VEVENT",
  ];
  return lines.filter(Boolean).join("\r\n");
}

export function rutinaIcs() {
  const until = "UNTIL=20271231T000000Z";
  const events = [
    vevent({
      uid: "unidos-video-mie-vie@nuestro-plan",
      summary: "Videollamada Unidos 💕",
      description: "Miércoles y viernes. Bianka tele 9–17 Perú. Diego puede tele desde las 12 Suecia.",
      dtstart: "20260902T090000",
      dtend: "20260902T120000",
      rrule: `FREQ=WEEKLY;BYDAY=WE,FR;${until}`,
      tzid: "America/Lima",
    }),
    vevent({
      uid: "unidos-diego-swim@nuestro-plan",
      summary: "Diego · pileta 🏊",
      description: "Sábados 10:00–11:30, luego compras y casa ~13:00.",
      dtstart: "20260905T100000",
      dtend: "20260905T113000",
      rrule: `FREQ=WEEKLY;BYDAY=SA;${until}`,
      tzid: "Europe/Stockholm",
    }),
    vevent({
      uid: "unidos-diego-gym@nuestro-plan",
      summary: "Diego · gym 💪",
      description: "Domingos 9:00–10:30, compras de la semana, libre desde las 14:00.",
      dtstart: "20260906T090000",
      dtend: "20260906T103000",
      rrule: `FREQ=WEEKLY;BYDAY=SU;${until}`,
      tzid: "Europe/Stockholm",
    }),
  ];

  for (const d of getUserDates().filter((x) => !x.done)) {
    const tzid = d.quien === "diego" ? "Europe/Stockholm" : "America/Lima";
    events.push(vevent({
      uid: `${d.id}@nuestro-plan`,
      summary: `${d.titulo} 💕`,
      description: d.notas || "Date Unidos",
      dtstart: stamp(d.fecha, d.hora || "12:00"),
      dtend: addHour(d.fecha, d.hora || "12:00", 1),
      tzid,
    }));
  }

  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Unidos//Plan//ES\r\nCALSCALE:GREGORIAN\r\n${events.join("\r\n")}\r\nEND:VCALENDAR`;
}

export function downloadRutinaIcs() {
  const ics = rutinaIcs();
  downloadBytes(new TextEncoder().encode(ics), "unidos-google-calendar.ics", "text/calendar");
}
