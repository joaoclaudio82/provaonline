// Funções puras reutilizáveis: sem estado, sem DOM, sem efeitos colaterais.
export const Utils = Object.freeze({
  shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  range(count) {
    return Array.from({ length: count }, (_, i) => i);
  },
  formatClock(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  },
  escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },
  toGradeOutOfTen(correctCount, totalCount) {
    return Number(((correctCount / totalCount) * 10).toFixed(2));
  },
});
