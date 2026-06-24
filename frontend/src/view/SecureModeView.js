// Travas de tela do modo seguro: bloqueio de teclado, detecção de saída do mouse,
// perda de foco, troca de aba e tentativa de PrintScreen, mais o overlay de advertência.
//
// Aviso honesto: o navegador NÃO consegue bloquear o print screen do sistema nem uma
// foto de celular. A tecla PrintScreen chega ao JavaScript apenas em alguns
// navegadores/sistemas (geralmente no keyup). Aqui ela é tratada de forma best-effort:
// registramos a tentativa e cobrimos a tela com o véu. É dissuasivo, não absoluto.

let onViolation = null;   // (title, message) -> registra advertência
let onVeilHold = null;    // (message) -> cobre a tela enquanto a condição durar
let onVeilFlash = null;   // (message) -> cobre a tela por um instante
let onVeilRelease = null; // () -> libera a tela
let listeners = [];

function isPrintScreen(event) {
  return event.key === "PrintScreen" || event.code === "PrintScreen" || event.keyCode === 44;
}

function handleKeyDown(event) {
  // Bloqueia toda entrada de teclado; a prova é só com o mouse.
  event.preventDefault();
  event.stopPropagation();
  onViolation("Teclado bloqueado", "A prova é respondida apenas com o mouse. O teclado está desativado.");
  return false;
}

function handleKeyUp(event) {
  // PrintScreen costuma chegar no keyup. Best-effort: registra e borra a tela.
  if (isPrintScreen(event)) {
    onViolation("Captura de tela detectada", "Capturar a tela é proibido. A tentativa foi registrada.");
    onVeilFlash("Captura bloqueada");
  }
}

function detectMouseLeave(event) {
  const leftViewport = !event.relatedTarget && !event.toElement;
  if (leftViewport) {
    onViolation("Mouse fora da tela", "Mantenha o cursor dentro da janela durante toda a avaliação.");
    onVeilHold("Tela protegida");
  }
}

function detectMouseReturn() {
  onVeilRelease();
}

function detectFocusLoss() {
  onViolation("Janela perdeu o foco", "Não troque de aba ou janela durante a prova.");
  onVeilHold("Tela protegida");
}

function detectFocusGain() {
  onVeilRelease();
}

function detectVisibilityChange() {
  if (document.hidden) detectFocusLoss();
  else onVeilRelease();
}

function prevent(event) {
  event.preventDefault();
}

function attach(name, target, handler, options) {
  target.addEventListener(name, handler, options);
  listeners.push({ name, target, handler, options });
}

function requestFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) element.requestFullscreen().catch(() => {});
}

export const SecureModeView = Object.freeze({
  enter({ onViolation: violationHandler, onVeilHold: holdHandler, onVeilFlash: flashHandler, onVeilRelease: releaseHandler }) {
    onViolation = violationHandler;
    onVeilHold = holdHandler;
    onVeilFlash = flashHandler;
    onVeilRelease = releaseHandler;

    attach("keydown", document, handleKeyDown, true);
    attach("keyup", document, handleKeyUp, true);
    attach("mouseout", document, detectMouseLeave);
    attach("mouseover", document, detectMouseReturn);
    attach("blur", window, detectFocusLoss);
    attach("focus", window, detectFocusGain);
    attach("visibilitychange", document, detectVisibilityChange);
    attach("contextmenu", document, prevent, true);
    attach("copy", document, prevent, true);
    attach("paste", document, prevent, true);
    attach("cut", document, prevent, true);
    attach("dragstart", document, prevent, true);
    requestFullscreen();
  },

  exit() {
    listeners.forEach(({ name, target, handler, options }) =>
      target.removeEventListener(name, handler, options)
    );
    listeners = [];
    onViolation = null;
    onVeilHold = null;
    onVeilFlash = null;
    onVeilRelease = null;
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  },

  showWarning(title, message, count, onResume) {
    document.getElementById("ov-title").textContent = title;
    document.getElementById("ov-msg").textContent = `${message} Advertências: ${count}.`;
    document.getElementById("overlay").classList.add("show");
    const resumeButton = document.getElementById("ov-resume");
    resumeButton.onclick = () => {
      document.getElementById("overlay").classList.remove("show");
      requestFullscreen();
      if (onResume) onResume();
    };
  },
});
