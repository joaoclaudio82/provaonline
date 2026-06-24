import { ApiClient } from "../services/ApiClient.js";
import { ExamState } from "../model/ExamState.js";
import { ExamView } from "../view/ExamView.js";
import { ResultView } from "../view/ResultView.js";
import { ScreenView } from "../view/ScreenView.js";
import { SecureModeView } from "../view/SecureModeView.js";
import { AntiCaptureView } from "../view/AntiCaptureView.js";

// Orquestra a prova no navegador: busca da API, seleção, advertências, relógio e envio.
// A correção é feita no servidor; aqui só coletamos respostas e exibimos o resultado.
export class ExamController {
  #state = null;
  #clockTimerId = null;
  #credentials = null;

  constructor() {
    ExamView.bind({
      onSelect: (questionIndex, optionIndex) => this.#handleSelect(questionIndex, optionIndex),
      onFinish: () => this.#handleFinishRequest(),
    });
    ResultView.bind({ onBack: () => this.#returnToLogin() });
  }

  // Recebe a prova já carregada da API e as credenciais (para o envio).
  begin(exam, credentials) {
    this.#credentials = credentials;
    this.#state = new ExamState(exam);

    ExamView.renderHeader(exam.login);
    ExamView.renderQuestions(this.#state.questions, this.#state.answers);
    ExamView.updateProgress(0);
    ExamView.updateClock(this.#state.remainingSeconds);
    AntiCaptureView.showWatermark(exam.login);
    ScreenView.show("screen-exam");
    SecureModeView.enter({
      onViolation: (title, message) => this.#handleViolation(title, message),
      onVeilHold: (message) => AntiCaptureView.holdVeil(message),
      onVeilFlash: (message) => AntiCaptureView.flashVeil(message),
      onVeilRelease: () => AntiCaptureView.releaseVeil(),
    });
    this.#startClock();
  }

  #handleSelect(questionIndex, optionIndex) {
    this.#state.selectAnswer(questionIndex, optionIndex);
    ExamView.markSelection(questionIndex, optionIndex);
    ExamView.updateProgress(this.#state.answeredCount());
  }

  #handleViolation(title, message) {
    if (this.#state.isFinished) return;
    const count = this.#state.registerViolation();
    SecureModeView.showWarning(title, message, count, null);
  }

  #startClock() {
    clearInterval(this.#clockTimerId);
    this.#clockTimerId = setInterval(() => {
      const remaining = this.#state.decrementClock();
      ExamView.updateClock(remaining);
      if (remaining <= 0) this.#finish(true);
    }, 1000);
  }

  #handleFinishRequest() {
    const answered = this.#state.answeredCount();
    const total = this.#state.questions.length;
    const message =
      answered < total
        ? `Você respondeu ${answered} de ${total}. Finalizar mesmo assim?`
        : "Finalizar e enviar a prova?";
    if (window.confirm(message)) this.#finish(false);
  }

  async #finish(finishedByTime) {
    if (this.#state.isFinished) return;
    this.#state.isFinished = true;
    clearInterval(this.#clockTimerId);
    SecureModeView.exit();
    AntiCaptureView.releaseVeil();
    AntiCaptureView.hideWatermark();

    const payload = {
      login: this.#credentials.login,
      senha: this.#credentials.senha,
      answers: this.#state.toSubmitAnswers(),
      violations: this.#state.violations,
      finished_by: finishedByTime ? "tempo" : "envio",
    };

    try {
      const result = await ApiClient.submitExam(payload);
      ResultView.render(
        {
          grade: result.grade,
          correctCount: result.correct_count,
          total: result.total,
          violations: result.violations,
          elapsedSeconds: result.elapsed_seconds,
        },
        finishedByTime
      );
      ScreenView.show("screen-done");
    } catch (error) {
      // Falha de rede no envio: avisa sem perder o que foi feito.
      window.alert("Falha ao enviar a prova: " + error.message + " Tente finalizar novamente.");
      this.#state.isFinished = false;
    }
  }

  #returnToLogin() {
    ScreenView.show("screen-login");
  }
}
