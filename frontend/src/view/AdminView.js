import { Utils } from "../utils/Utils.js";

const STATUS_LABELS = {
  nao_iniciou: "Não iniciou",
  em_andamento: "Em andamento",
  enviada: "Enviada",
};

const STATUS_CLASS = {
  nao_iniciou: "wait",
  em_andamento: "ok",
  enviada: "done",
};

let onEditStudent = null;

function statusPill(status) {
  const label = STATUS_LABELS[status] || status;
  const css = STATUS_CLASS[status] || "";
  return `<span class="pill ${css}">${Utils.escapeHtml(label)}</span>`;
}

// Tela do professor. Trabalha com objetos planos vindos da API.
export const AdminView = Object.freeze({
  bind({
    onPickCsv,
    onCsvSelected,
    onExport,
    onGabarito,
    onClear,
    onBack,
    onSaveConfig,
    onGenerateRoster,
    onDownloadRoster,
    onManageQuestions,
    onAddStudent,
    onEditStudent: editHandler,
    onSaveStudentEdit,
    onCancelStudentEdit,
  }) {
    onEditStudent = editHandler;
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
    document.getElementById("btn-add-student").addEventListener("click", onAddStudent);
    document.getElementById("edit-student-save").addEventListener("click", onSaveStudentEdit);
    document.getElementById("edit-student-cancel").addEventListener("click", onCancelStudentEdit);

    document.getElementById("roster-box").addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-student]");
      if (!button || !onEditStudent) return;
      onEditStudent(Number(button.dataset.editStudent));
    });
  },

  renderConfig(config) {
    document.getElementById("cfg-questions").value = config.question_count;
    document.getElementById("cfg-questions").max = config.max_question_count;
    document.getElementById("cfg-minutes").value = config.time_minutes;
    document.getElementById("cfg-allow-retake-all").checked = Boolean(config.allow_retake_all);
    document.getElementById("cfg-questions-range").textContent =
      ` (entre ${config.min_question_count} e ${config.max_question_count})`;
    this.clearConfigError();
    const retakeLabel = config.allow_retake_all ? " · refazer liberado para todos" : "";
    document.getElementById("cfg-current").textContent =
      `Atual: ${config.question_count} questões · ${config.time_minutes} minutos${retakeLabel}.`;
  },

  setQuestionBankStatus(config) {
    document.getElementById("question-bank-status").textContent =
      `${config.max_question_count} questões disponíveis para sorteio (mín. ${config.min_question_count}, máx. ${config.max_question_count}).`;
  },

  readConfig() {
    return {
      questionCount: Number(document.getElementById("cfg-questions").value),
      timeMinutes: Number(document.getElementById("cfg-minutes").value),
      allowRetakeAll: document.getElementById("cfg-allow-retake-all").checked,
    };
  },

  readNewStudent() {
    return {
      login: document.getElementById("new-student-login").value.trim(),
      senha: document.getElementById("new-student-senha").value.trim(),
      allowRetake: document.getElementById("new-student-retake").checked,
    };
  },

  clearNewStudentForm() {
    document.getElementById("new-student-login").value = "";
    document.getElementById("new-student-senha").value = "";
    document.getElementById("new-student-retake").checked = false;
    document.getElementById("add-student-err").textContent = "";
  },

  showAddStudentError(message) {
    document.getElementById("add-student-err").textContent = message;
  },

  openStudentEditor(student) {
    document.getElementById("edit-student-login").value = student.login;
    document.getElementById("edit-student-senha").value = student.senha;
    document.getElementById("edit-student-retake").checked = Boolean(student.allow_retake);
    document.getElementById("edit-student-err").textContent = "";
    document.getElementById("student-edit-overlay").classList.add("show");
    document.getElementById("student-edit-overlay").dataset.studentId = String(student.id);
    document.getElementById("edit-student-login").focus();
  },

  readStudentEditor() {
    return {
      studentId: Number(document.getElementById("student-edit-overlay").dataset.studentId),
      login: document.getElementById("edit-student-login").value.trim(),
      senha: document.getElementById("edit-student-senha").value.trim(),
      allowRetake: document.getElementById("edit-student-retake").checked,
    };
  },

  closeStudentEditor() {
    document.getElementById("student-edit-overlay").classList.remove("show");
    document.getElementById("student-edit-overlay").dataset.studentId = "";
    document.getElementById("edit-student-err").textContent = "";
  },

  showStudentEditError(message) {
    document.getElementById("edit-student-err").textContent = message;
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

  renderRosterTable(students) {
    const box = document.getElementById("roster-box");
    if (!students || students.length === 0) {
      box.innerHTML = "";
      return;
    }
    const head =
      "<tr><th>Login</th><th>Senha</th><th>Status</th><th>Refazer</th><th>Ações</th></tr>";
    const body = students
      .map((student) => {
        const retake = student.allow_retake ? "Sim" : "Não";
        return (
          `<tr>` +
          `<td>${Utils.escapeHtml(student.login)}</td>` +
          `<td>${Utils.escapeHtml(student.senha)}</td>` +
          `<td>${statusPill(student.exam_status)}</td>` +
          `<td>${retake}</td>` +
          `<td><div class="roster-actions">` +
          `<button class="btn alt sm" type="button" data-edit-student="${student.id}">Editar</button>` +
          `</div></td>` +
          `</tr>`
        );
      })
      .join("");
    box.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  },

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
