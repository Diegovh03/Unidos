# Nuestro Plan 🌷

App romántica de calendario, contador y frases diarias para pareja a distancia (Lima ↔ Suecia).

## Características

- Contador al próximo evento (Gotemburgo, España, Lima, máster…)
- Días juntos desde el 24 de junio de 2026
- Calendario que se marca solo (juntos, viajes, aniversario, hitos)
- 60 frases diarias de amor, ánimo y autores
- Notificación diaria a las **8:00 AM (hora Lima)**
- Diseño romántico lila con tulipanes 🌷, perritos 🐶 y gatitos 🐱
- PWA instalable en el móvil

## Cómo usar

### Opción 1: Abrir directamente
Abre `index.html` en el navegador (Chrome/Edge recomendado).

> **Nota:** Para módulos ES y Service Worker, sirve la carpeta con un servidor local:

```bash
npx serve nuestro-plan
```

Luego abre `http://localhost:3000`

### Opción 2: Instalar como app (PWA)
1. Abre la app en Chrome (Android) o Safari (iOS)
2. Menú → "Agregar a pantalla de inicio" / "Instalar app"
3. Pulsa **Activar 🌷** para las notificaciones diarias

## Fechas del plan

| Fecha | Evento |
|-------|--------|
| 24 jun 2026 | Aniversario |
| 30 ago 2026 | Tú → Gotemburgo |
| 30 oct 2026 | Ella → España |
| 8–17 nov 2026 | Juntos en España (10 días) |
| 15 jun – 15 ago 2027 | Juntos en Lima |
| 15 ene 2028 | Hito para ella |
| 2028–2030 | Plan máster Suecia |

## Editar fechas o frases

- Fechas: `js/plan.js`
- Frases: `js/frases.js` (y `sw.js` para notificaciones offline)
