import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

let onSelect = null;
let totalQuestions = 0;
let visibilityObserver = null;
let visibilityRatios = new Map();

function updateActiveQuestionCard(cards) {
  let bestCard = null;
  let bestRatio = 0;
  cards.forEach((card) => {
    const ratio = visibilityRatios.get(card) || 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestCard = card;
    }
  });
  cards.forEach((card) => {
    card.classList.toggle("qcard-active", card === bestCard && bestRatio > 0);
  });
}

function stopQuestionVisibilityObserver() {
  if (visibilityObserver) {
    visibilityObserver.disconnect();
    visibilityObserver = null;
  }
  visibilityRatios = new Map();
}

function startQuestionVisibilityObserver(container) {
  stopQuestionVisibilityObserver();
  const cards = container.querySelectorAll(".qcard");
  if (!cards.length) return;

  visibilityRatios = new Map();
  cards.forEach((card, index) => {
    visibilityRatios.set(card, index === 0 ? 1 : 0);
    card.classList.toggle("qcard-active", index === 0);
  });

  visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visibilityRatios.set(entry.target, entry.intersectionRatio);
      });
      updateActiveQuestionCard(cards);
    },
    {
      root: container,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    }
  );
  cards.forEach((card) => visibilityObserver.observe(card));
}

// Renderiza a tela da prova: questões, alternativas, progresso e relógio.
export const ExamView = Object.freeze({
  bind({ onSelect: selectHandler, onFinish }) {
    onSelect = selectHandler;
    document.getElementById("btn-finish").addEventListener("click", onFinish);
  },

  renderHeader(login) {
    document.getElementById("exam-who").textContent = "Estudante: " + login;
  },

  renderQuestions(questions, answers) {
    totalQuestions = questions.length;
    const container = document.getElementById("exam-scroll");
    container.innerHTML = "";
    questions.forEach((question, questionIndex) => {
      container.appendChild(this._buildQuestionCard(question, questionIndex, answers[questionIndex]));
    });
    startQuestionVisibilityObserver(container);
  },

  stopVisibilityTracking() {
    stopQuestionVisibilityObserver();
  },

  _buildQuestionCard(question, questionIndex, selectedIndex) {
    const card = document.createElement("div");
    card.className = "qcard";

    const number = document.createElement("div");
    number.className = "qnum";
    number.textContent = `Questão ${questionIndex + 1} de ${totalQuestions}`;

    const statement = document.createElement("div");
    statement.className = "qtext";
    statement.innerHTML = Utils.escapeHtml(question.statement);

    card.appendChild(number);
    card.appendChild(statement);
    question.options.forEach((option, optionIndex) => {
      card.appendChild(
        this._buildOption(questionIndex, optionIndex, option.text, optionIndex === selectedIndex)
      );
    });
    return card;
  },

  _buildOption(questionIndex, optionIndex, text, isSelected) {
    const option = document.createElement("div");
    option.className = "opt" + (isSelected ? " sel" : "");
    option.dataset.q = questionIndex;
    option.dataset.o = optionIndex;
    option.innerHTML =
      `<span class="mark">${Config.OPTION_LETTERS[optionIndex]}</span>` +
      `<span class="otext">${Utils.escapeHtml(text)}</span>`;
    option.addEventListener("click", () => onSelect(questionIndex, optionIndex));
    return option;
  },

  markSelection(questionIndex, optionIndex) {
    const card = document.querySelectorAll(".qcard")[questionIndex];
    card.querySelectorAll(".opt").forEach((opt) =>
      opt.classList.toggle("sel", Number(opt.dataset.o) === optionIndex)
    );
  },

  updateProgress(answeredCount) {
    document.getElementById("exam-progress").textContent =
      `${answeredCount} / ${totalQuestions} respondidas`;
  },

  updateClock(remainingSeconds) {
    const clock = document.getElementById("exam-timer");
    clock.textContent = Utils.formatClock(remainingSeconds);
    clock.classList.toggle("low", remainingSeconds <= Config.LOW_TIME_THRESHOLD_SECONDS);
  },
});
