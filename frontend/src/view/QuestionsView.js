import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

const OPTION_IDS = ["q-opt-a", "q-opt-b", "q-opt-c", "q-opt-d", "q-opt-e"];

// Formulário e listagem do banco de questões na área do professor.
export const QuestionsView = Object.freeze({
  bind({ onSave, onCancelEdit, onBack, onEdit, onDelete }) {
    document.getElementById("btn-q-save").addEventListener("click", onSave);
    document.getElementById("btn-q-cancel").addEventListener("click", onCancelEdit);
    document.getElementById("btn-q-back").addEventListener("click", onBack);
    document.getElementById("q-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const id = Number(button.dataset.id);
      if (button.dataset.action === "edit") onEdit(id);
      if (button.dataset.action === "delete") onDelete(id);
    });
  },

  setBankStatus(count, maxCount) {
    document.getElementById("q-bank-status").textContent =
      `${count} questão(ões) no banco. A prova pode sortear até ${maxCount}.`;
  },

  setFormMode({ editing = false } = {}) {
    document.getElementById("q-form-title").textContent = editing ? "Editar questão" : "Nova questão";
    document.getElementById("btn-q-save").textContent = editing ? "Atualizar questão" : "Salvar questão";
    document.getElementById("btn-q-cancel").classList.toggle("hide", !editing);
  },

  readForm() {
    const options = OPTION_IDS.map((id) => document.getElementById(id).value.trim());
    return {
      statement: document.getElementById("q-statement").value.trim(),
      options,
      correct_index: Number(document.getElementById("q-correct").value),
      explanation: document.getElementById("q-explanation").value.trim(),
    };
  },

  loadForm(question) {
    document.getElementById("q-statement").value = question.statement;
    OPTION_IDS.forEach((id, index) => {
      document.getElementById(id).value = question.options[index] || "";
    });
    document.getElementById("q-correct").value = String(question.correct_index);
    document.getElementById("q-explanation").value = question.explanation || "";
    this.clearFormError();
  },

  resetForm() {
    document.getElementById("q-statement").value = "";
    OPTION_IDS.forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.getElementById("q-correct").value = "0";
    document.getElementById("q-explanation").value = "";
    this.clearFormError();
    this.setFormMode({ editing: false });
  },

  showFormError(message) {
    document.getElementById("q-form-err").textContent = message;
  },

  clearFormError() {
    document.getElementById("q-form-err").textContent = "";
  },

  renderList(questions) {
    const box = document.getElementById("q-list");
    if (!questions.length) {
      box.innerHTML = '<p class="hint">Nenhuma questão cadastrada ainda.</p>';
      return;
    }
    box.innerHTML = questions
      .map((question, index) => {
        const correct = Config.OPTION_LETTERS[question.correct_index] || "?";
        const preview = Utils.escapeHtml(question.statement);
        return (
          `<div class="q-item">` +
          `<div class="qnum">Questão ${index + 1} · gabarito ${correct}</div>` +
          `<div class="q-item-text">${preview}</div>` +
          `<div class="row q-item-actions">` +
          `<button class="btn alt" type="button" data-action="edit" data-id="${question.id}">Editar</button>` +
          `<button class="btn alt warn" type="button" data-action="delete" data-id="${question.id}">Excluir</button>` +
          `</div></div>`
        );
      })
      .join("");
  },
});
