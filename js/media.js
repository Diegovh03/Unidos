const IDB_NAME = "unidos-media";
const IDB_STORE = "files";
const IDB_VER = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VER);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE);
    };
  });
}

export async function idbPut(id, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDel(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const MAX_CLOUD_VIDEO = 450_000;

export async function saveVideo(id, file) {
  await idbPut(id, file);
  if (file.size <= MAX_CLOUD_VIDEO) {
    try {
      const data = await blobToDataUrl(file);
      const { cloudSet } = await import("./cloud.js");
      await cloudSet(`foto-${id}`, { data, mediaType: "video" });
    } catch { /* local ok */ }
  }
}

export async function loadVideo(id) {
  const blob = await idbGet(id);
  if (blob) return URL.createObjectURL(blob);

  try {
    const { cloudGet } = await import("./cloud.js");
    const remote = await cloudGet(`foto-${id}`);
    if (remote?.data && remote?.mediaType === "video") return remote.data;
  } catch { /* ignore */ }

  return null;
}

export async function deleteVideo(id) {
  await idbDel(id);
}

export function isVideoFile(file) {
  return file?.type?.startsWith("video/") ?? false;
}

export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
