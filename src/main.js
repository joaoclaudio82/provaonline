import { AppController } from "./controller/AppController.js";

// Ponto de entrada: inicia a aplicação quando o DOM estiver pronto.
document.addEventListener("DOMContentLoaded", () => {
  new AppController().run().catch((error) => {
    console.error(error);
    document.getElementById("login-err").textContent =
      "Falha ao iniciar a aplicação. Verifique se está rodando via servidor HTTP.";
  });
});
