import { ExamModel } from "../model/ExamModel.js";
import { GradingService } from "../model/GradingService.js";
import { ResultRepository } from "../model/ResultRepository.js";
import { ExamView } from "../view/ExamView.js";
import { ResultView } from "../view/ResultView.js";
import { ScreenView } from "../view/ScreenView.js";
import { SecureModeView } from "../view/SecureModeView.js";
import { AntiCaptureView } from "../view/AntiCaptureView.js";

// Orquestra o ciclo de vida da prova: início, seleção, advertências, relógio e envio.
export class ExamController {
  #questionBank;
  #examConfig;
  #model = null;
  #clockTimerId = null;

  constructor({ questionBank, examConfig }) {
    this.#questionBank = questionBank;
    this.#examConfig = examConfig;
    ExamView.bind({
      onSelect: (questionIndex, optionIndex) => this.#handleSelect(questionIndex, optionIndex),
      onFinish: () => this.#handleFinishRequest(),
    });
    ResultView.bind({ onBack: () => this.#returnToLogin() });
  }

  start(login) {
    this.#model = new ExamModel(login, this.#questionBank, this.#examConfig);
    ExamView.renderHeader(login);
    ExamView.renderQuestions(this.#model.questions, this.#model.answers);
    ExamView.updateProgress(0);
    ExamView.updateClock(this.#model.remainingSeconds);
    AntiCaptureView.showWatermark(login);
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
    this.#model.selectAnswer(questionIndex, optionIndex);
    ExamView.markSelection(questionIndex, optionIndex);
    ExamView.updateProgress(this.#model.answeredCount());
  }

  #handleViolation(title, message) {
    if (this.#model.isFinished) return;
    const count = this.#model.registerViolation();
    SecureModeView.showWarning(title, message, count, null);
  }

  #startClock() {
    clearInterval(this.#clockTimerId);
    this.#clockTimerId = setInterval(() => {
      const remaining = this.#model.decrementClock();
      ExamView.updateClock(remaining);
      if (remaining <= 0) this.#finish(true);
    }, 1000);
  }

  #handleFinishRequest() {
    const answered = this.#model.answeredCount();
    const total = this.#model.questions.length;
    const message =
      answered < total
        ? `Você respondeu ${answered} de ${total}. Finalizar mesmo assim?`
        : "Finalizar e enviar a prova?";
    if (window.confirm(message)) this.#finish(false);
  }

  #finish(finishedByTime) {
    if (this.#model.isFinished) return;
    this.#model.isFinished = true;
    clearInterval(this.#clockTimerId);
    SecureModeView.exit();
    ExamView.stopVisibilityTracking();
    AntiCaptureView.releaseVeil();
    AntiCaptureView.hideWatermark();

    const finishedBy = finishedByTime ? "tempo" : "envio";
    const result = GradingService.grade(this.#model, finishedBy);
    ResultRepository.save(result);
    ResultView.render(result, finishedByTime);
    ScreenView.show("screen-done");
  }

  #returnToLogin() {
    ScreenView.show("screen-login");
  }
}
