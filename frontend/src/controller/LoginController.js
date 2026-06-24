import { ApiClient } from "../services/ApiClient.js";
import { LoginView } from "../view/LoginView.js";

// Autentica e inicia a prova via API. A verificação de senha e o controle de
// "já realizou a prova" acontecem no servidor.
export class LoginController {
  #onExamReady;
  #onAdminRequested;

  constructor({ onExamReady, onAdminRequested }) {
    this.#onExamReady = onExamReady;
    this.#onAdminRequested = onAdminRequested;
    LoginView.bind({
      onEnter: () => this.#handleEnter(),
      onAdmin: this.#onAdminRequested,
    });
  }

  refreshHint() {
    LoginView.setHint("Entre com seu login e senha para iniciar a prova.");
  }

  async #handleEnter() {
    LoginView.clearError();
    const { login, senha } = LoginView.readCredentials();
    if (!login || !senha) return LoginView.showError("Informe login e senha.");

    try {
      const exam = await ApiClient.startExam(login, senha);
      this.#onExamReady(exam, { login, senha });
    } catch (error) {
      LoginView.showError(error.message);
    }
  }
}
