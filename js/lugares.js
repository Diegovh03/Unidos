export const FOTO_BIANKA = "assets/fotos/bianka.png";
export const FOTO_DIEGO = "assets/fotos/diego.png";

export const LUGARES = {
  lima: {
    id: "lima",
    nombre: "Lima",
    quien: "Bianka",
    direccion: "Av. Salaverry 1880",
    ciudad: "Lima, Perú",
    lat: -12.099663,
    lon: -77.0565585,
    mapsQuery: "Av. Salaverry 1880, Lima, Peru",
  },
  gotemburgo: {
    id: "gotemburgo",
    nombre: "Gotemburgo",
    quien: "Diego",
    direccion: "Motgången 324",
    ciudad: "Göteborg, Suecia",
    lat: 57.6870517,
    lon: 11.9936869,
    mapsQuery: "Motgången 324, Göteborg, Sweden",
  },
};

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(x))));
}

export function osmEmbed(lugar) {
  const pad = 0.008;
  const bbox = [
    lugar.lon - pad,
    lugar.lat - pad,
    lugar.lon + pad,
    lugar.lat + pad,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lugar.lat}%2C${lugar.lon}`;
}

export function mapsLink(lugar) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar.mapsQuery)}`;
}
