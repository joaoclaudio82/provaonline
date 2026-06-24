import { ApiClient } from "../services/ApiClient.js";
import { QuestionsView } from "../view/QuestionsView.js";
import { ScreenView } from "../view/ScreenView.js";

// Cadastro, edição e exclusão de questões do banco.
export class QuestionsController {
  #getPassword;
  #onBack;
  #onBankChanged;
  #questions = [];
  #editingId = null;

  constructor({ getPassword, onBack, onBankChanged }) {
    this.#getPassword = getPassword;
    this.#onBack = onBack;
    this.#onBankChanged = onBankChanged;
    QuestionsView.bind({
      onSave: () => this.#handleSave(),
      onCancelEdit: () => this.#cancelEdit(),
      onBack: () => this.#onBack(),
      onEdit: (id) => this.#startEdit(id),
      onDelete: (id) => this.#handleDelete(id),
    });
  }

  async open() {
    await this.#refresh();
    QuestionsView.resetForm();
    this.#editingId = null;
    ScreenView.show("screen-questions");
  }

  async #refresh() {
    const password = this.#getPassword();
    const [questions, config] = await Promise.all([
      ApiClient.listQuestions(password),
      ApiClient.getConfig(password),
    ]);
    this.#questions = questions;
    QuestionsView.renderList(questions);
    QuestionsView.setBankStatus(questions.length, config.max_question_count);
  }

  #startEdit(id) {
    const question = this.#questions.find((item) => item.id === id);
    if (!question) return;
    this.#editingId = id;
    QuestionsView.loadForm(question);
    QuestionsView.setFormMode({ editing: true });
    document.getElementById("q-statement").focus();
  }

  #cancelEdit() {
    this.#editingId = null;
    QuestionsView.resetForm();
  }

  async #handleSave() {
    QuestionsView.clearFormError();
    const payload = QuestionsView.readForm();
    const filledOptions = payload.options.filter(Boolean);
    if (!payload.statement) return QuestionsView.showFormError("Informe o enunciado.");
    if (filledOptions.length < 2) {
      return QuestionsView.showFormError("Preencha pelo menos duas alternativas.");
    }
    if (payload.correct_index < 0 || payload.correct_index >= filledOptions.length) {
      return QuestionsView.showFormError("Selecione a alternativa correta.");
    }

    const body = {
      statement: payload.statement,
      options: filledOptions,
      correct_index: payload.correct_index,
      explanation: payload.explanation,
    };

    const password = this.#getPassword();
    try {
      if (this.#editingId) {
        await ApiClient.updateQuestion(password, this.#editingId, body);
      } else {
        await ApiClient.createQuestion(password, body);
      }
      this.#editingId = null;
      QuestionsView.resetForm();
      await this.#refresh();
      if (this.#onBankChanged) await this.#onBankChanged();
    } catch (error) {
      QuestionsView.showFormError(error.message);
    }
  }

  async #handleDelete(id) {
    const question = this.#questions.find((item) => item.id === id);
    if (!question) return;
    const preview = question.statement.slice(0, 80);
    const confirmed = window.confirm(`Excluir esta questão?\n\n${preview}${question.statement.length > 80 ? "…" : ""}`);
    if (!confirmed) return;
    try {
      await ApiClient.deleteQuestion(this.#getPassword(), id);
      if (this.#editingId === id) this.#cancelEdit();
      await this.#refresh();
      if (this.#onBankChanged) await this.#onBankChanged();
    } catch (error) {
      QuestionsView.showFormError(error.message);
    }
  }
}
