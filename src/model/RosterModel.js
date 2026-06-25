import { Config } from "../config/Config.js";
import { Utils } from "../utils/Utils.js";

// Lista de estudantes e autenticação. Começa com uma lista de teste até o professor carregar o CSV.
export class RosterModel {
  #students;
  #isCustom = false;

  constructor() {
    this.#students = this.#buildFallback();
  }

  #buildFallback() {
    return Utils.range(Config.MAX_STUDENTS).map((i) => ({
      login: "aluno" + String(i + 1).padStart(2, "0"),
      senha: "123",
    }));
  }

  load(students) {
    this.#students = students.slice(0, Config.MAX_STUDENTS);
    this.#isCustom = true;
    return this.#students.length;
  }

  isCustom() {
    return this.#isCustom;
  }

  count() {
    return this.#students.length;
  }

  authenticate(login, senha) {
    return this.#students.find((s) => s.login === login && s.senha === senha) || null;
  }

  list() {
    return this.#students.map((s) => ({ login: s.login, senha: s.senha }));
  }
}
