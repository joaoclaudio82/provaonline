import { QuestionBank } from "../model/QuestionBank.js";
import { RosterModel } from "../model/RosterModel.js";
import { ExamConfigModel } from "../model/ExamConfigModel.js";
import { RulesController } from "./RulesController.js";
import { LoginController } from "./LoginController.js";
import { ExamController } from "./ExamController.js";
import { AdminController } from "./AdminController.js";
import { LoginView } from "../view/LoginView.js";

// Controlador raiz: monta os modelos e controladores por injeção de dependência
// e amarra os fluxos entre eles. É o único que conhece todas as peças.
export class AppController {
  #roster = new RosterModel();
  #questionBank = new QuestionBank();
  #examConfig;
  #rulesController;
  #loginController;
  #examController;
  #adminController;

  async run() {
    await this.#questionBank.load();

    // A configuração depende do tamanho do banco (teto de questões), então é criada
    // depois do carregamento.
    this.#examConfig = new ExamConfigModel(this.#questionBank.size());

    this.#examController = new ExamController({
      questionBank: this.#questionBank,
      examConfig: this.#examConfig,
    });

    this.#adminController = new AdminController({
      roster: this.#roster,
      questionBank: this.#questionBank,
      examConfig: this.#examConfig,
      onRosterChanged: () => this.#loginController.refreshHint(),
    });

    this.#loginController = new LoginController({
      roster: this.#roster,
      onAuthenticated: (login) => this.#examController.start(login),
      onAdminRequested: () => this.#adminController.open(),
    });

    // A tela de regras abre primeiro; o aceite leva ao login.
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
