/**
 * Config de Supabase para "Nuestro espacio" (fotos compartidas por día).
 * Mientras enabled sea false, la página funciona pero avisa que falta configurar.
 *
 * El bucket "momentos" es PRIVADO — las fotos se muestran vía URLs firmadas
 * temporales (ver getMomentosTodos en supabase-diario.js), no por URL pública directa.
 * `supabaseAnonKey` es la Publishable Key de Supabase (segura para el frontend,
 * NO es la service_role ni una secret key).
 */
export const diarioConfig = {
  enabled: true,
  supabaseUrl: "https://daxqpagrnnxpnbajyqsl.supabase.co",
  supabaseAnonKey: "sb_publishable_abBxpxgfruRaLueR9VBfWQ_QjrfbRdk",
  bucket: "momentos",
  table: "momentos",
};
