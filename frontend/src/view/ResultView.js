import { Utils } from "../utils/Utils.js";

// Tela final mostrada ao estudante após enviar a prova.
export const ResultView = Object.freeze({
  bind({ onBack }) {
    document.getElementById("btn-done-back").addEventListener("click", onBack);
  },

  render(result, finishedByTime) {
    document.getElementById("done-score").textContent = result.grade.toFixed(1).replace(".", ",");

    const violationNote = result.violations
      ? ` · ${result.violations} advertência(s) de saída de tela`
      : "";
    document.getElementById("done-detail").textContent =
      `${result.correctCount} de ${result.total} corretas · tempo: ${Utils.formatClock(result.elapsedSeconds)}${violationNote}`;

    document.getElementById("done-msg").textContent = finishedByTime
      ? "O tempo esgotou. Sua prova foi enviada automaticamente."
      : "Sua prova foi enviada com sucesso.";
  },
});
