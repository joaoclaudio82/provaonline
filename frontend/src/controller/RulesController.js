import { RulesView } from "../view/RulesView.js";
import { ScreenView } from "../view/ScreenView.js";

// Mostra as regras antes do login e só libera o acesso após o aceite explícito.
export class RulesController {
  #onAccepted;

  constructor({ onAccepted }) {
    this.#onAccepted = onAccepted;
    RulesView.bind({ onAccept: () => this.#handleAccept() });
  }

  open() {
    RulesView.render();
    ScreenView.show("screen-rules");
  }

  #handleAccept() {
    this.#onAccepted();
  }
}
