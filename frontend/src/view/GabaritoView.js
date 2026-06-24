import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

// Tela de gabarito comentado, visível só na área do professor.
// Recebe itens vindos da API: { statement, options[], correct_index, explanation }.
export const GabaritoView = Object.freeze({
  bind({ onBack }) {
    document.getElementById("btn-gab-back").addEventListener("click", onBack);
  },

  render(items) {
    const box = document.getElementById("gab-list");
    box.innerHTML = "";
    items.forEach((item, index) => box.appendChild(this._buildEntry(item, index)));
  },

  _buildEntry(item, index) {
    const entry = document.createElement("div");
    entry.style.marginBottom = "22px";

    const optionsHtml = item.options
      .map((text, optionIndex) => {
        const isCorrect = optionIndex === item.correct_index;
        const label = `${Config.OPTION_LETTERS[optionIndex]}) ${Utils.escapeHtml(text)}`;
        return isCorrect ? `<strong>${label} ✓</strong>` : label;
      })
      .join("<br>");

    entry.innerHTML =
      `<div class="qnum">Banco · item ${index + 1}</div>` +
      `<div style="font-size:16px;margin:4px 0 8px;line-height:1.4">${Utils.escapeHtml(item.statement)}</div>` +
      `<div style="font-size:15px;line-height:1.6">${optionsHtml}</div>` +
      `<div class="hint" style="margin-top:6px"><em>${Utils.escapeHtml(item.explanation)}</em></div>`;
    return entry;
  },
});
