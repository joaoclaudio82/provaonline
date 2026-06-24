import { Utils } from "../utils/Utils.js";

// Correção pura: recebe uma prova encerrada e devolve o objeto de resultado.
// Não acessa DOM nem armazenamento.
export const GradingService = Object.freeze({
  grade(examModel, finishedBy) {
    let correctCount = 0;

    const details = examModel.questions.map((question, questionIndex) => {
      const selectedDisplayIndex = examModel.answers[questionIndex];
      const selectedOriginalIndex = selectedDisplayIndex === null
        ? null
        : question.options[selectedDisplayIndex].originalIndex;
      const isCorrect = selectedOriginalIndex === question.correctOriginalIndex;
      if (isCorrect) correctCount++;
      return {
        bankNumber: question.bankIndex + 1,
        selectedOriginalIndex,
        correctOriginalIndex: question.correctOriginalIndex,
        isCorrect,
      };
    });

    return {
      login: examModel.login,
      correctCount,
      total: examModel.questions.length,
      grade: Utils.toGradeOutOfTen(correctCount, examModel.questions.length),
      violations: examModel.violations,
      elapsedSeconds: examModel.elapsedSeconds(),
      finishedBy,
      bankNumbers: details.map((d) => d.bankNumber).join("|"),
      studentAnswers: details.map((d) => (d.selectedOriginalIndex === null ? "-" : d.selectedOriginalIndex)).join("|"),
      answerKey: details.map((d) => d.correctOriginalIndex).join("|"),
      isoDate: new Date().toISOString(),
    };
  },
});
