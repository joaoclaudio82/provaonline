// Banco de questões. Carrega os dados crus uma vez e expõe acesso somente-leitura.
export class QuestionBank {
  #items = [];

  async load(url = "./src/model/questions.json") {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao carregar o banco de questões (${response.status}).`);
    this.#items = await response.json();
    return this.#items.length;
  }

  size() {
    return this.#items.length;
  }

  getByIndex(index) {
    return this.#items[index];
  }

  getAll() {
    return this.#items.slice();
  }
}
