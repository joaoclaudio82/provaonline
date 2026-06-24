import { ScreenView } from "./ScreenView.js";

// Renderiza e lê a tela de login. Não conhece regra de negócio: recebe handlers via bind.
export const LoginView = Object.freeze({
  show() {
    ScreenView.show("screen-login");
  },

  bind({ onEnter, onAdmin }) {
    document.getElementById("btn-entrar").addEventListener("click", onEnter);
    document.getElementById("btn-admin").addEventListener("click", onAdmin);
  },

  readCredentials() {
    return {
      login: document.getElementById("login").value.trim(),
      senha: document.getElementById("senha").value,
    };
  },

  showError(message) {
    document.getElementById("login-err").textContent = message;
  },

  clearError() {
    document.getElementById("login-err").textContent = "";
  },

  setHint(message) {
    document.getElementById("login-hint").textContent = message;
  },

  reset() {
    document.getElementById("login").value = "";
    document.getElementById("senha").value = "";
    this.clearError();
  },
});
