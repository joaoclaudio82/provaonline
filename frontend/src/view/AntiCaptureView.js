import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

// Defesas anti-captura visíveis na tela da prova:
//  - marca d'água com o login do estudante repetida por cima do conteúdo;
//  - véu de borrão que cobre a tela em tentativas de captura ou perda de foco.
//
// Importante: nada disso bloqueia print screen ou foto de fato. A marca d'água
// torna qualquer captura rastreável; o véu cobre a tela no instante típico da
// tentativa. São medidas dissuasivas, não uma barreira absoluta.
let veilTimerId = null;

function repeatWatermarkLabel(login, copies) {
  const safeLogin = Utils.escapeHtml(login);
  return Utils.range(copies).map(() => `<span>${safeLogin}</span>`).join("");
}

export const AntiCaptureView = Object.freeze({
  showWatermark(login) {
    const watermark = document.getElementById("watermark");
    watermark.innerHTML = repeatWatermarkLabel(login, 120);
  },

  hideWatermark() {
    document.getElementById("watermark").innerHTML = "";
  },

  // Cobre a tela imediatamente e mantém por um tempo curto (ms).
  flashVeil(message, holdMs = Config.BLUR_HOLD_MS) {
    const veil = document.getElementById("veil");
    document.getElementById("veil-msg").textContent = message;
    veil.classList.add("show");
    clearTimeout(veilTimerId);
    veilTimerId = setTimeout(() => veil.classList.remove("show"), holdMs);
  },

  // Mantém a tela coberta enquanto a condição durar (ex.: janela sem foco).
  holdVeil(message) {
    clearTimeout(veilTimerId);
    document.getElementById("veil-msg").textContent = message;
    document.getElementById("veil").classList.add("show");
  },

  releaseVeil() {
    clearTimeout(veilTimerId);
    document.getElementById("veil").classList.remove("show");
  },
});
