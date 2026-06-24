import { Config } from "../config/Config.js";

// Parâmetros da prova definidos pelo professor: número de questões e tempo em minutos.
// Valida contra os limites do Config e contra o tamanho do banco, e persiste a escolha.
export class ExamConfigModel {
  #questionCount;
  #timeMinutes;
  #bankSize;

  constructor(bankSize) {
    this.#bankSize = bankSize;
    const stored = this.#readStored();
    this.#questionCount = stored?.questionCount ?? Config.DEFAULT_QUESTION_COUNT;
    this.#timeMinutes = stored?.timeMinutes ?? Config.DEFAULT_TIME_MINUTES;
    // Garante coerência mesmo que o banco tenha menos questões que o padrão salvo.
    this.#questionCount = this.#clampQuestionCount(this.#questionCount);
    this.#timeMinutes = this.#clampMinutes(this.#timeMinutes);
  }

  // Maior número de questões aceitável: limitado pelo banco e pelo teto do Config.
  maxQuestionCount() {
    return Math.min(this.#bankSize, Config.MAX_QUESTION_COUNT);
  }

  questionCount() {
    return this.#questionCount;
  }

  timeMinutes() {
    return this.#timeMinutes;
  }

  timeSeconds() {
    return this.#timeMinutes * 60;
  }

  // Aplica novos valores já validados. Devolve { ok, errors } para a View exibir.
  update({ questionCount, timeMinutes }) {
    const errors = [];

    const parsedCount = Number(questionCount);
    const parsedMinutes = Number(timeMinutes);

    if (!Number.isInteger(parsedCount) || parsedCount < Config.MIN_QUESTION_COUNT || parsedCount > this.maxQuestionCount()) {
      errors.push(`A quantidade de questões deve ser um inteiro entre ${Config.MIN_QUESTION_COUNT} e ${this.maxQuestionCount()}.`);
    }
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < Config.MIN_TIME_MINUTES || parsedMinutes > Config.MAX_TIME_MINUTES) {
      errors.push(`O tempo deve ser um inteiro entre ${Config.MIN_TIME_MINUTES} e ${Config.MAX_TIME_MINUTES} minutos.`);
    }
    if (errors.length > 0) return { ok: false, errors };

    this.#questionCount = parsedCount;
    this.#timeMinutes = parsedMinutes;
    this.#persist();
    return { ok: true, errors: [] };
  }

  #clampQuestionCount(value) {
    return Math.max(Config.MIN_QUESTION_COUNT, Math.min(value, this.maxQuestionCount()));
  }

  #clampMinutes(value) {
    return Math.max(Config.MIN_TIME_MINUTES, Math.min(value, Config.MAX_TIME_MINUTES));
  }

  #readStored() {
    try {
      return JSON.parse(localStorage.getItem(Config.CONFIG_KEY));
    } catch (_) {
      return null;
    }
  }

  #persist() {
    localStorage.setItem(
      Config.CONFIG_KEY,
      JSON.stringify({ questionCount: this.#questionCount, timeMinutes: this.#timeMinutes })
    );
  }
}
