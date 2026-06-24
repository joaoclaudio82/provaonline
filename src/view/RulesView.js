import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

// Tela de regras exibida antes do login. O botão de aceite só libera com o checkbox marcado.
export const RulesView = Object.freeze({
  bind({ onAccept }) {
    const checkbox = document.getElementById("accept-check");
    const acceptButton = document.getElementById("btn-accept");
    checkbox.addEventListener("change", () => {
      acceptButton.disabled = !checkbox.checked;
    });
    acceptButton.addEventListener("click", () => {
      if (checkbox.checked) onAccept();
    });
  },

  render() {
    const list = document.getElementById("rules-list");
    list.innerHTML = Config.RULES.map((rule) => `<li>${Utils.escapeHtml(rule)}</li>`).join("");
  },
});
