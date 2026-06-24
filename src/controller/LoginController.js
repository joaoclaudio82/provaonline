import { ResultRepository } from "../model/ResultRepository.js";
import { LoginView } from "../view/LoginView.js";

// Valida credenciais e decide se a prova pode começar.
export class LoginController {
  #roster;
  #onAuthenticated;

  constructor({ roster, onAuthenticated, onAdminRequested }) {
    this.#roster = roster;
    this.#onAuthenticated = onAuthenticated;
    LoginView.bind({
      onEnter: () => this.#handleEnter(),
      onAdmin: onAdminRequested,
    });
  }

  refreshHint() {
    LoginView.setHint(
      this.#roster.isCustom()
        ? `${this.#roster.count()} estudantes carregados. Pronto para iniciar.`
        : "Aguardando carregamento da lista de estudantes pelo professor."
    );
  }

  #handleEnter() {
    LoginView.clearError();
    const { login, senha } = LoginView.readCredentials();

    if (!login || !senha) return LoginView.showError("Informe login e senha.");

    const student = this.#roster.authenticate(login, senha);
    if (!student) return LoginView.showError("Login ou senha inválidos.");

    if (ResultRepository.hasSubmitted(login)) {
      return LoginView.showError("Este login já realizou a prova.");
    }

    this.#onAuthenticated(login);
  }
}
