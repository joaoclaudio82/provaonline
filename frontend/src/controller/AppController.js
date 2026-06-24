import { RulesController } from "./RulesController.js";
import { LoginController } from "./LoginController.js";
import { ExamController } from "./ExamController.js";
import { AdminController } from "./AdminController.js";
import { LoginView } from "../view/LoginView.js";

// Controlador raiz do front. Monta os controladores e amarra os fluxos.
// Os dados vivem no backend; aqui só há orquestração de telas e chamadas à API.
export class AppController {
  #rulesController;
  #loginController;
  #examController;
  #adminController;

  run() {
    this.#examController = new ExamController();
    this.#adminController = new AdminController();

    this.#loginController = new LoginController({
      onExamReady: (exam, credentials) => this.#examController.begin(exam, credentials),
      onAdminRequested: () => this.#adminController.open(),
    });

    this.#rulesController = new RulesController({
      onAccepted: () => this.#goToLogin(),
    });

    this.#rulesController.open();
  }

  #goToLogin() {
    this.#loginController.refreshHint();
    LoginView.reset();
    LoginView.show();
  }
}
