export const CIUDADES = {
  lima: {
    id: "lima",
    albumId: "lima",
    nombre: "Lima",
    pais: "Perú",
    bandera: "🇵🇪",
    quien: "bianka",
    emoji: "🐱",
    cover: "assets/fotos/bianka.png",
    defaultFotos: [
      { url: "assets/fotos/bianka.png", title: "Bianka en Lima" },
    ],
  },
  gotemburgo: {
    id: "gotemburgo",
    albumId: "gotemburgo",
    nombre: "Gotemburgo",
    pais: "Suecia",
    bandera: "🇸🇪",
    quien: "diego",
    emoji: "🐶",
    cover: "assets/fotos/diego.png",
    defaultFotos: [
      { url: "assets/fotos/diego.png", title: "Diego en Gotemburgo" },
    ],
  },
};

export function getCiudad(id) {
  return CIUDADES[id] || null;
}
