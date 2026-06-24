import { Utils } from "../utils/Utils.js";

// Tela do professor. Trabalha com objetos planos vindos da API.
export const AdminView = Object.freeze({
  bind({ onPickCsv, onCsvSelected, onExport, onGabarito, onClear, onBack, onSaveConfig, onGenerateRoster, onDownloadRoster, onManageQuestions }) {
    document.getElementById("btn-pick-csv").addEventListener("click", onPickCsv);
    document.getElementById("csv-input").addEventListener("change", onCsvSelected);
    document.getElementById("btn-export").addEventListener("click", onExport);
    document.getElementById("btn-gabarito").addEventListener("click", onGabarito);
    document.getElementById("btn-clear").addEventListener("click", onClear);
    document.getElementById("btn-admin-back").addEventListener("click", onBack);
    document.getElementById("btn-save-config").addEventListener("click", onSaveConfig);
    document.getElementById("btn-generate-roster").addEventListener("click", onGenerateRoster);
    document.getElementById("btn-download-roster").addEventListener("click", onDownloadRoster);
    document.getElementById("btn-manage-questions").addEventListener("click", onManageQuestions);
  },

  // config: { question_count, time_minutes, max_question_count, min_question_count, ... }
  renderConfig(config) {
    document.getElementById("cfg-questions").value = config.question_count;
    document.getElementById("cfg-questions").max = config.max_question_count;
    document.getElementById("cfg-minutes").value = config.time_minutes;
    document.getElementById("cfg-questions-range").textContent =
      ` (entre ${config.min_question_count} e ${config.max_question_count})`;
    this.clearConfigError();
    document.getElementById("cfg-current").textContent =
      `Atual: ${config.question_count} questões · ${config.time_minutes} minutos.`;
  },

  setQuestionBankStatus(config) {
    document.getElementById("question-bank-status").textContent =
      `${config.max_question_count} questões disponíveis para sorteio (mín. ${config.min_question_count}, máx. ${config.max_question_count}).`;
  },

  readConfig() {
    return {
      questionCount: Number(document.getElementById("cfg-questions").value),
      timeMinutes: Number(document.getElementById("cfg-minutes").value),
    };
  },

  showConfigError(message) {
    document.getElementById("cfg-err").textContent = message;
  },

  clearConfigError() {
    document.getElementById("cfg-err").textContent = "";
  },

  openFilePicker() {
    document.getElementById("csv-input").click();
  },

  setCsvStatus(message) {
    document.getElementById("csv-status").textContent = message;
  },

  readRosterCount() {
    return Number(document.getElementById("roster-count").value);
  },

  setRosterStatus(message) {
    document.getElementById("roster-status").textContent = message;
  },

  showRosterError(message) {
    document.getElementById("roster-err").textContent = message;
  },

  clearRosterError() {
    document.getElementById("roster-err").textContent = "";
  },

  setDownloadRosterEnabled(enabled) {
    document.getElementById("btn-download-roster").disabled = !enabled;
  },

  // students: [{ login, senha }]
  renderRosterTable(students) {
    const box = document.getElementById("roster-box");
    if (!students || students.length === 0) {
      box.innerHTML = "";
      return;
    }
    const head = "<tr><th>Login</th><th>Senha</th></tr>";
    const body = students
      .map(
        (student) =>
          `<tr><td>${Utils.escapeHtml(student.login)}</td><td>${Utils.escapeHtml(student.senha)}</td></tr>`
      )
      .join("");
    box.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  },

  // rows: [{ login, correct_count, total, grade, violations, elapsed_seconds, finished_by }]
  renderResultsTable(rows) {
    const box = document.getElementById("results-box");
    if (!rows || rows.length === 0) {
      box.innerHTML = '<p class="hint" style="margin-top:14px">Nenhum resultado registrado ainda.</p>';
      return;
    }
    const head =
      "<tr><th>Login</th><th>Acertos</th><th>Nota</th><th>Tempo</th><th>Advert.</th><th>Fim</th></tr>";
    const body = rows
      .map((r) =>
        `<tr><td>${Utils.escapeHtml(r.login)}</td><td>${r.correct_count}/${r.total}</td>` +
        `<td>${r.grade.toFixed(2).replace(".", ",")}</td>` +
        `<td>${Utils.formatClock(r.elapsed_seconds)}</td>` +
        `<td>${r.violations}</td><td>${Utils.escapeHtml(r.finished_by)}</td></tr>`
      )
      .join("");
    box.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  },
});
