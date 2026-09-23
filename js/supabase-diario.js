import { diarioConfig } from "./diario-config.js";

const MAX_SIZE = 2000;
const QUALITY = 0.88;
const SIGN_EXPIRES = 3600; // segundos que dura cada URL firmada

/** Redimensiona + comprime a JPEG y devuelve un Blob (no dataURL, para subir directo sin inflar ~33% en base64). */
export function compressToBlob(file, maxSize = MAX_SIZE, quality = QUALITY) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function headers(extra = {}) {
  return {
    apikey: diarioConfig.supabaseAnonKey,
    Authorization: `Bearer ${diarioConfig.supabaseAnonKey}`,
    ...extra,
  };
}

export function isDiarioEnabled() {
  return diarioConfig.enabled && diarioConfig.supabaseUrl && diarioConfig.supabaseAnonKey;
}

/**
 * Pide URLs firmadas temporales para un lote de paths del bucket privado.
 * Devuelve un mapa { path: urlFirmadaAbsoluta }. Los paths sin firma (bucket/policy
 * mal configurados) simplemente quedan fuera del mapa — no lanza error.
 */
async function getSignedUrls(paths, expiresIn = SIGN_EXPIRES) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {};

  const res = await fetch(
    `${diarioConfig.supabaseUrl}/storage/v1/object/sign/${diarioConfig.bucket}`,
    {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn, paths: unique }),
    }
  );
  if (!res.ok) return {};

  const results = await res.json();
  const map = {};
  for (const r of results) {
    if (r?.signedURL && r?.path) {
      map[r.path] = `${diarioConfig.supabaseUrl}/storage/v1${r.signedURL}`;
    }
  }
  return map;
}

/**
 * Sube (o reemplaza) la foto del día de una persona + su caption.
 * `imageBlob` debe venir ya recortado/filtrado y en buen tamaño (ver photo-editor.js);
 * si en algún caso llega un File sin editar, igual funciona pero sin recorte previo.
 * `destino`: "collage" | "recuerdos" | "ambos" — dónde debe aparecer la foto.
 * `categoria`: "nosotros" | "viajes" | "especial" | "comida" | "naturaleza" | "ciudad" | "casa" | "otros".
 */
export async function guardarMomento(dateKey, persona, imageBlob, caption, destino = "ambos", categoria = "nosotros") {
  if (!isDiarioEnabled()) throw new Error("Momentos no está configurado todavía.");

  const blob = imageBlob.type === "image/jpeg" ? imageBlob : await compressToBlob(imageBlob);
  const path = `${dateKey}/${persona}-${Date.now()}.jpg`;

  const upRes = await fetch(
    `${diarioConfig.supabaseUrl}/storage/v1/object/${diarioConfig.bucket}/${path}`,
    {
      method: "POST",
      headers: headers({ "Content-Type": "image/jpeg", "x-upsert": "true" }),
      body: blob,
    }
  );
  if (!upRes.ok) throw new Error("No se pudo subir la foto.");

  const row = { date: dateKey, persona, foto_path: path, caption: caption || "", destino, categoria };
  const dbRes = await fetch(
    `${diarioConfig.supabaseUrl}/rest/v1/${diarioConfig.table}?on_conflict=date,persona`,
    {
      method: "POST",
      headers: headers({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(row),
    }
  );
  if (!dbRes.ok) throw new Error("No se pudo guardar el momento.");
  const [saved] = await dbRes.json();
  return saved;
}

/**
 * Trae todos los momentos (más antiguos primero) con `foto_url` ya resuelto
 * a una URL firmada temporal lista para usar en <img src>. El bucket es privado,
 * así que sin esto las fotos no se podrían mostrar.
 */
export async function getMomentosTodos(limit = 500) {
  if (!isDiarioEnabled()) return [];
  const url =
    `${diarioConfig.supabaseUrl}/rest/v1/${diarioConfig.table}` +
    `?select=*&order=date.asc,created_at.asc&limit=${limit}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];

  const rows = await res.json();
  if (!rows.length) return rows;

  const signedMap = await getSignedUrls(rows.map((r) => r.foto_path));
  return rows.map((r) => ({ ...r, foto_url: signedMap[r.foto_path] || "" }));
}
