export const THEME_STORAGE_KEY = "sinapsa-theme";

/**
 * Roda antes da primeira pintura, no <head>, para evitar flash de tema errado.
 * Precisa ser síncrono e à prova de localStorage bloqueado (modo privado,
 * cookies de terceiros desligados) — por isso o try/catch silencioso.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;
