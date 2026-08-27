import { renderCoupleRibbon, bindCoupleRibbon } from "../couple-photos.js";
import { animateNumber, staggerIn } from "../motion.js";
import { LUGARES, haversineKm, osmEmbed, mapsLink } from "../lugares.js";

function placeCard(lugar, who) {
  return `
    <article class="place-card card-dark anim-in">
      <p class="place-who">${who}</p>
      <h3>${lugar.direccion}</h3>
      <p class="place-city">${lugar.ciudad}</p>
      <div class="place-map">
        <iframe
          title="Mapa ${lugar.nombre}"
          src="${osmEmbed(lugar)}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <a class="btn-pink btn-block place-maps" href="${mapsLink(lugar)}" target="_blank" rel="noopener">
        Abrir en Maps
      </a>
    </article>
  `;
}

export async function renderMapa(container) {
  const ribbonHtml = await renderCoupleRibbon({ showDays: false });
  const km = haversineKm(LUGARES.lima, LUGARES.gotemburgo);

  container.innerHTML = `
    <div class="mapa-screen">
      <div id="mapa-ribbon-wrap">${ribbonHtml}</div>
      ${placeCard(LUGARES.lima, "🐱 Bianka")}
      ${placeCard(LUGARES.gotemburgo, "🐶 Diego")}
      <div class="mapa-card card-dark anim-in glow-card">
        <p class="mapa-card-label">Distancia entre las dos casas</p>
        <p class="mapa-card-km"><span id="mapa-km">0</span></p>
        <p class="mapa-card-sub">Av. Salaverry 1880 · Motgången 324</p>
      </div>
    </div>
  `;

  animateNumber(document.getElementById("mapa-km"), km, {
    duration: 1400,
    format: (n) => `~${n.toLocaleString("es-PE")} km`,
  });

  bindCoupleRibbon(container, (id) => {
    const cards = container.querySelectorAll(".place-card");
    const el = id === "lima" ? cards[0] : cards[1];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  staggerIn(container);
}

export function ensureCiudadViewer() {
  if (document.getElementById("ciudad-viewer")) return;
  const viewer = document.createElement("div");
  viewer.id = "ciudad-viewer";
  viewer.className = "lightbox hidden";
  viewer.innerHTML = `<img alt="" /><button type="button" class="lightbox-close" aria-label="Cerrar">×</button>`;
  document.body.appendChild(viewer);
  viewer.addEventListener("click", () => viewer.classList.add("hidden"));
}
