// Constantes de configuração da aplicação. Sem estado e sem dependências.
export const Config = Object.freeze({
  // Limites e padrões dos parâmetros que o professor define na tela de admin.
  // QUESTIONS_PER_EXAM e TIME_LIMIT viram valores escolhidos em ExamConfigModel;
  // aqui ficam apenas as faixas válidas e os padrões iniciais.
  DEFAULT_QUESTION_COUNT: 20,
  MIN_QUESTION_COUNT: 5,
  MAX_QUESTION_COUNT: 50, // teto real é o tamanho do banco; ver ExamConfigModel

  DEFAULT_TIME_MINUTES: 120,
  MIN_TIME_MINUTES: 5,
  MAX_TIME_MINUTES: 300,

  LOW_TIME_THRESHOLD_SECONDS: 300,
  MAX_STUDENTS: 50,
  STORAGE_KEY: "prova_resultados_v1",
  CONFIG_KEY: "prova_config_v1",
  OPTION_LETTERS: ["A", "B", "C", "D", "E"],

  // Quanto tempo o véu de borrão fica ativo após uma tentativa de captura (ms).
  BLUR_HOLD_MS: 1200,
  MOUSE_IDLE_MS: 2000,

  // Texto das regras exibidas antes do login. O estudante precisa aceitar para entrar.
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
