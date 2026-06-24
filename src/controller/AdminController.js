import { CsvCodec } from "../model/CsvCodec.js";
import { ResultRepository } from "../model/ResultRepository.js";
import { AdminView } from "../view/AdminView.js";
import { GabaritoView } from "../view/GabaritoView.js";
import { ScreenView } from "../view/ScreenView.js";

// Área do professor: parâmetros da prova, carregar CSV, exportar resultados, ver gabarito.
export class AdminController {
  #roster;
  #questionBank;
  #examConfig;
  #onRosterChanged;

  constructor({ roster, questionBank, examConfig, onRosterChanged }) {
    this.#roster = roster;
    this.#questionBank = questionBank;
    this.#examConfig = examConfig;
    this.#onRosterChanged = onRosterChanged;

    AdminView.bind({
      onPickCsv: () => AdminView.openFilePicker(),
      onCsvSelected: (event) => this.#handleCsvSelected(event),
      onExport: () => this.#handleExport(),
      onGabarito: () => this.#handleGabarito(),
      onClear: () => this.#handleClear(),
      onBack: () => ScreenView.show("screen-login"),
      onSaveConfig: () => this.#handleSaveConfig(),
    });
    GabaritoView.bind({ onBack: () => this.open() });
  }

  open() {
    AdminView.renderConfig(this.#examConfig);
    AdminView.renderResultsTable(ResultRepository.findAll());
    ScreenView.show("screen-admin");
  }

  #handleSaveConfig() {
    const { ok, errors } = this.#examConfig.update(AdminView.readConfig());
    if (!ok) return AdminView.showConfigError(errors);
    AdminView.clearConfigError();
    AdminView.renderConfig(this.#examConfig);
  }

  #handleCsvSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const students = CsvCodec.parseRoster(reader.result);
      if (students.length === 0) return AdminView.setCsvStatus("CSV inválido");
      const loaded = this.#roster.load(students);
      AdminView.setCsvStatus(`${loaded} estudantes carregados`);
      this.#onRosterChanged();
    };
    reader.readAsText(file, "utf-8");
  }

  #handleExport() {
    const results = ResultRepository.findAll();
    if (results.length === 0) return window.alert("Nenhum resultado para exportar.");
    this.#downloadCsv(CsvCodec.buildResultsCsv(results), "resultados_prova.csv");
  }

  #downloadCsv(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  #handleGabarito() {
    GabaritoView.render(this.#questionBank.getAll());
    ScreenView.show("screen-gab");
  }

  #handleClear() {
    const confirmed = window.confirm(
      "Apagar TODOS os resultados deste navegador? Esta ação não pode ser desfeita."
    );
    if (!confirmed) return;
    ResultRepository.clear();
    AdminView.renderResultsTable([]);
  }
}
