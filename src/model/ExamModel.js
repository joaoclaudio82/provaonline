import { Utils } from "../utils/Utils.js";

// Estado de uma prova em andamento: sorteio das questões, respostas, relógio e advertências.
// Recebe o QuestionBank e a configuração (nº de questões e tempo) por injeção, então
// não conhece a origem dos dados nem valores fixos.
export class ExamModel {
  constructor(login, questionBank, examConfig) {
    this.login = login;
    this.questions = this.#drawQuestions(questionBank, examConfig.questionCount());
    this.answers = new Array(this.questions.length).fill(null);
    this.startTimestamp = Date.now();
    this.remainingSeconds = examConfig.timeSeconds();
    this.violations = 0;
    this.isFinished = false;
  }

  // Sorteia `count` itens do banco e embaralha as alternativas de cada um.
  #drawQuestions(questionBank, count) {
    const drawnIndexes = Utils.shuffle(Utils.range(questionBank.size())).slice(0, count);

    return drawnIndexes.map((bankIndex) => {
      const item = questionBank.getByIndex(bankIndex);
      const options = Utils.shuffle(
        item.o.map((text, originalIndex) => ({ text, originalIndex }))
      );
      return { bankIndex, statement: item.q, options, correctOriginalIndex: item.c };
    });
  }

  selectAnswer(questionIndex, optionIndex) {
    this.answers[questionIndex] = optionIndex;
  }

  answeredCount() {
    return this.answers.filter((answer) => answer !== null).length;
  }

  decrementClock() {
    this.remainingSeconds--;
    return this.remainingSeconds;
  }

  registerViolation() {
    return ++this.violations;
  }

  elapsedSeconds() {
    return Math.round((Date.now() - this.startTimestamp) / 1000);
  }
}
