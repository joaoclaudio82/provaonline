import { AppController } from "./controller/AppController.js";

// Ponto de entrada do front.
document.addEventListener("DOMContentLoaded", () => {
  new AppController().run();
});
