import { cloudConfig } from "./cloud-config.js";

export async function cloudGet(path) {
  if (!cloudConfig.enabled) return null;
  try {
    const res = await fetch(`${cloudConfig.baseUrl}/${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function cloudSet(path, data) {
  if (!cloudConfig.enabled) return false;
  try {
    await fetch(`${cloudConfig.baseUrl}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return true;
  } catch {
    return false;
  }
}

export function compressImage(file, maxSize = 1600, quality = 0.85) {
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function formatText(str) {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

export function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const YO_KEY = "nuestro-plan-yo";

export function getYo() {
  return localStorage.getItem(YO_KEY);
}

export function setYo(yo) {
  localStorage.setItem(YO_KEY, yo);
}

export function clearYo() {
  localStorage.removeItem(YO_KEY);
}

export const PERSONAS = {
  diego: { nombre: "Diego", emoji: "🐶" },
  bianka: { nombre: "Bianka", emoji: "🐱" },
};

export function uid() {
  return crypto.randomUUID();
}

export async function savePhoto(id, dataUrl) {
  const { idbPut } = await import("./media.js");
  const blob = dataUrlToBlob(dataUrl);
  await idbPut(`foto-${id}`, blob);
}

export async function loadPhoto(id) {
  const { idbGet, idbPut } = await import("./media.js");
  const blob = await idbGet(`foto-${id}`);
  if (blob instanceof Blob) return URL.createObjectURL(blob);
  if (typeof blob === "string") return blob;

  const legacy = localStorage.getItem(`foto-${id}`);
  if (legacy) {
    try {
      await idbPut(`foto-${id}`, dataUrlToBlob(legacy));
      localStorage.removeItem(`foto-${id}`);
    } catch { /* keep */ }
    return legacy;
  }

  const remote = await cloudGet(`foto-${id}`);
  if (remote?.data) {
    try { await idbPut(`foto-${id}`, dataUrlToBlob(remote.data)); } catch { /* */ }
    return remote.data;
  }
  return null;
}

export async function deletePhoto(id) {
  const { idbDel } = await import("./media.js");
  await idbDel(`foto-${id}`);
  localStorage.removeItem(`foto-${id}`);
}

export async function photoToBytes(id) {
  const { idbGet } = await import("./media.js");
  const blob = await idbGet(`foto-${id}`);
  if (blob instanceof Blob) return new Uint8Array(await blob.arrayBuffer());
  const src = await loadPhoto(id);
  if (!src) return null;
  if (src.startsWith("blob:")) {
    return new Uint8Array(await (await fetch(src)).arrayBuffer());
  }
  if (src.startsWith("data:")) {
    const body = src.split(",")[1] || "";
    const bin = atob(body);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return null;
}

function dataUrlToBlob(dataUrl) {
  if (dataUrl instanceof Blob) return dataUrl;
  const [head, body] = String(dataUrl).split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] || "image/jpeg";
  const bin = atob(body || "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
