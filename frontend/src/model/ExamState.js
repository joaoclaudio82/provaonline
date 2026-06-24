// Estado local da prova no navegador. As questões vêm da API (sem gabarito) e as
// respostas ficam aqui até o envio; a correção acontece no servidor.
export class ExamState {
  constructor(exam) {
    this.login = exam.login;
    this.timeMinutes = exam.time_minutes;
    this.questions = exam.questions; // [{ position, statement, options:[{text}] }]
    this.answers = new Array(this.questions.length).fill(null);
    this.remainingSeconds = exam.time_minutes * 60;
    this.violations = 0;
    this.isFinished = false;
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

  // Monta o payload de envio: posição da questão + índice marcado (na ordem exibida).
  toSubmitAnswers() {
    return this.questions.map((question, index) => ({
      position: question.position,
      option_index: this.answers[index],
    }));
  }
}
