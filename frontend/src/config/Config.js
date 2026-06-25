// Constantes de interface usadas pelo front. Parâmetros da prova (nº de questões,
// tempo, limites) vêm do backend; aqui ficam só ajustes de apresentação.
export const Config = Object.freeze({
  API_BASE: "http://localhost:8001",
  LOW_TIME_THRESHOLD_SECONDS: 300,
  OPTION_LETTERS: ["A", "B", "C", "D", "E"],
  BLUR_HOLD_MS: 1200,
  MOUSE_IDLE_MS: 2000,
  RULES: [
    "A prova é respondida exclusivamente com o mouse. O teclado fica desativado durante toda a avaliação.",
    "É proibido capturar a tela (print screen) ou fotografar a prova. Tentativas são registradas e a tela é borrada.",
    "Apenas a questão em visualização fica legível; as demais permanecem borradas enquanto você rola a prova.",
    "Se o cursor ficar parado por mais de 2 segundos, a tela inteira é borrada até você mover o mouse novamente.",
    "Não saia da janela, não troque de aba e não tire o cursor para fora da tela. Cada ocorrência gera advertência registrada.",
    "Seu login aparece marcado sobre a tela durante toda a prova. Qualquer captura identifica quem a fez.",
    "A prova tem tempo limite. Ao esgotar, ela é enviada automaticamente com as respostas marcadas até o momento.",
  ],
});
