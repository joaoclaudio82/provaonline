import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

// Tela do professor: seleção de CSV, status, tabela de resultados.
export const AdminView = Object.freeze({
  bind({ onPickCsv, onCsvSelected, onExport, onGabarito, onClear, onBack, onSaveConfig }) {
    document.getElementById("btn-pick-csv").addEventListener("click", onPickCsv);
    document.getElementById("csv-input").addEventListener("change", onCsvSelected);
    document.getElementById("btn-export").addEventListener("click", onExport);
    document.getElementById("btn-gabarito").addEventListener("click", onGabarito);
    document.getElementById("btn-clear").addEventListener("click", onClear);
    document.getElementById("btn-admin-back").addEventListener("click", onBack);
    document.getElementById("btn-save-config").addEventListener("click", onSaveConfig);
  },

  // Preenche os campos com a configuração atual e a faixa válida de questões.
  renderConfig(examConfig) {
    document.getElementById("cfg-questions").value = examConfig.questionCount();
    document.getElementById("cfg-questions").max = examConfig.maxQuestionCount();
    document.getElementById("cfg-minutes").value = examConfig.timeMinutes();
    document.getElementById("cfg-questions-range").textContent =
      ` (entre ${Config.MIN_QUESTION_COUNT} e ${examConfig.maxQuestionCount()})`;
    this.clearConfigError();
    this.showConfigSummary(examConfig);
  },

  readConfig() {
    return {
      questionCount: document.getElementById("cfg-questions").value,
      timeMinutes: document.getElementById("cfg-minutes").value,
    };
  },

  showConfigError(messages) {
    document.getElementById("cfg-err").textContent = messages.join(" ");
  },

  clearConfigError() {
    document.getElementById("cfg-err").textContent = "";
  },

  showConfigSummary(examConfig) {
    document.getElementById("cfg-current").textContent =
      `Atual: ${examConfig.questionCount()} questões · ${examConfig.timeMinutes()} minutos.`;
  },

  openFilePicker() {
    document.getElementById("csv-input").click();
  },

  setCsvStatus(message) {
    document.getElementById("csv-status").textContent = message;
  },

  renderResultsTable(results) {
    const box = document.getElementById("results-box");
    if (results.length === 0) {
      box.innerHTML = '<p class="hint" style="margin-top:14px">Nenhum resultado registrado ainda.</p>';
      return;
    }
    const head =
      "<tr><th>Login</th><th>Acertos</th><th>Nota</th><th>Tempo</th><th>Advert.</th><th>Fim</th></tr>";
    const rows = results
      .map((r) =>
        `<tr><td>${r.login}</td><td>${r.correctCount}/${r.total}</td>` +
        `<td>${r.grade.toFixed(2).replace(".", ",")}</td>` +
        `<td>${Utils.formatClock(r.elapsedSeconds)}</td>` +
        `<td>${r.violations}</td><td>${r.finishedBy}</td></tr>`
      )
      .join("");
    box.innerHTML = `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  },
});
