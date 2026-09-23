const FILTERS = [
  { id: "none", name: "Normal", css: "none" },
  { id: "warm", name: "Cálido", css: "saturate(1.25) contrast(1.05) brightness(1.05) sepia(0.12)" },
  { id: "cool", name: "Frío", css: "saturate(1.1) contrast(1.05) brightness(1.02) hue-rotate(-8deg)" },
  { id: "bw", name: "B&N", css: "grayscale(1) contrast(1.1)" },
  { id: "vintage", name: "Vintage", css: "sepia(0.35) saturate(1.15) contrast(0.95) brightness(1.05)" },
];

/**
 * Muestra un editor de foto de pantalla completa (recorte + filtro).
 * Resuelve con un Blob JPEG listo para subir, o null si se cancela.
 */
export function openPhotoEditor(file) {
  return new Promise((resolve) => {
    if (!window.Cropper) {
      resolve(file);
      return;
    }

    let cropper = null;
    let selectedFilter = FILTERS[0];

    const overlay = document.createElement("div");
    overlay.className = "editor-overlay";
    overlay.innerHTML = `
      <div class="editor-top">
        <button type="button" class="editor-btn-text" id="editor-cancel">Cancelar</button>
        <span class="editor-title">Editar foto</span>
        <button type="button" class="editor-btn-text editor-btn-done" id="editor-done">Listo</button>
      </div>
      <div class="editor-canvas-wrap">
        <img id="editor-img" alt="" />
      </div>
      <div class="editor-aspect-row">
        <button type="button" class="editor-aspect active" data-ratio="1">Cuadrado</button>
        <button type="button" class="editor-aspect" data-ratio="0">Libre</button>
      </div>
      <div class="editor-filters-row" id="editor-filters"></div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add("editor-open");

    const imgEl = overlay.querySelector("#editor-img");
    const objectUrl = URL.createObjectURL(file);
    imgEl.src = objectUrl;

    const filtersRow = overlay.querySelector("#editor-filters");
    filtersRow.innerHTML = FILTERS.map(
      (f, i) => `
      <button type="button" class="editor-filter-btn ${i === 0 ? "active" : ""}" data-filter="${f.id}">
        <span class="editor-filter-swatch" style="filter:${f.css}"><img src="${objectUrl}" alt="" /></span>
        <span>${f.name}</span>
      </button>`
    ).join("");

    imgEl.onload = () => {
      cropper = new window.Cropper(imgEl, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        movable: true,
        zoomable: true,
        scalable: false,
        rotatable: false,
      });
    };

    overlay.querySelectorAll(".editor-aspect").forEach((btn) => {
      btn.addEventListener("click", () => {
        overlay.querySelectorAll(".editor-aspect").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const ratio = Number(btn.dataset.ratio);
        cropper?.setAspectRatio(ratio === 0 ? NaN : ratio);
      });
    });

    filtersRow.querySelectorAll(".editor-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filtersRow.querySelectorAll(".editor-filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFilter = FILTERS.find((f) => f.id === btn.dataset.filter) || FILTERS[0];
      });
    });

    function cleanup() {
      cropper?.destroy();
      cropper = null;
      URL.revokeObjectURL(objectUrl);
      document.body.classList.remove("editor-open");
      overlay.remove();
    }

    overlay.querySelector("#editor-cancel").addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    overlay.querySelector("#editor-done").addEventListener("click", () => {
      if (!cropper) {
        cleanup();
        resolve(null);
        return;
      }
      const cropped = cropper.getCroppedCanvas({
        maxWidth: 2000,
        maxHeight: 2000,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!cropped) {
        cleanup();
        resolve(null);
        return;
      }

      let outCanvas = cropped;
      if (selectedFilter.css !== "none") {
        const filtered = document.createElement("canvas");
        filtered.width = cropped.width;
        filtered.height = cropped.height;
        const ctx = filtered.getContext("2d");
        ctx.filter = selectedFilter.css;
        ctx.drawImage(cropped, 0, 0);
        outCanvas = filtered;
      }

      outCanvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  });
}
