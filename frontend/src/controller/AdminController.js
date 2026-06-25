import { ApiClient } from "../services/ApiClient.js";
import { AdminView } from "../view/AdminView.js";
import { GabaritoView } from "../view/GabaritoView.js";
import { ProfessorPasswordView } from "../view/ProfessorPasswordView.js";
import { QuestionsController } from "./QuestionsController.js";
import { ScreenView } from "../view/ScreenView.js";

// Área do professor. A senha é pedida ao abrir e enviada em cada chamada à API.
export class AdminController {
  #password = null;
  #roster = [];
  #questionsController;

  constructor() {
    this.#questionsController = new QuestionsController({
      getPassword: () => this.#password,
      onBack: () => this.#showAdmin(),
      onBankChanged: () => this.#refreshConfig(),
    });

    AdminView.bind({
      onPickCsv: () => AdminView.openFilePicker(),
      onCsvSelected: (event) => this.#handleCsvSelected(event),
      onExport: () => this.#handleExport(),
      onGabarito: () => this.#handleGabarito(),
      onClear: () => window.alert("Para reiniciar, envie um novo CSV de estudantes: isso recria a turma e zera os resultados."),
      onBack: () => this.#leave(),
      onSaveConfig: () => this.#handleSaveConfig(),
      onGenerateRoster: () => this.#handleGenerateRoster(),
      onDownloadRoster: () => this.#handleDownloadRoster(),
      onManageQuestions: () => this.#questionsController.open(),
      onAddStudent: () => this.#handleAddStudent(),
      onEditStudent: (studentId) => this.#handleEditStudent(studentId),
      onSaveStudentEdit: () => this.#handleSaveStudentEdit(),
      onCancelStudentEdit: () => AdminView.closeStudentEditor(),
    });
    GabaritoView.bind({ onBack: () => this.#showAdmin() });
  }

  async open() {
    let error = "";
    while (true) {
      const password = await ProfessorPasswordView.ask({ error });
      if (!password) return ScreenView.show("screen-login");
      this.#password = password;
      try {
        const config = await ApiClient.getConfig(this.#password);
        AdminView.renderConfig(config);
        AdminView.setQuestionBankStatus(config);
        await this.#refreshResults();
        await this.#refreshRoster();
        ScreenView.show("screen-admin");
        return;
      } catch (err) {
        this.#password = null;
        error = err.message;
      }
    }
  }

  async #refreshConfig() {
    const config = await ApiClient.getConfig(this.#password);
    AdminView.renderConfig(config);
    AdminView.setQuestionBankStatus(config);
  }

  async #refreshResults() {
    const rows = await ApiClient.listResults(this.#password);
    AdminView.renderResultsTable(rows);
  }

  async #refreshRoster() {
    const students = await ApiClient.listRoster(this.#password);
    this.#roster = students;
    AdminView.renderRosterTable(students);
    AdminView.setDownloadRosterEnabled(students.length > 0);
    AdminView.setRosterStatus(
      students.length > 0
        ? `${students.length} estudante(s) cadastrado(s). Edite login, senha ou libere refazer individualmente.`
        : "Nenhuma turma carregada."
    );
  }

  async #handleGenerateRoster() {
    AdminView.clearRosterError();
    const count = AdminView.readRosterCount();
    if (!Number.isInteger(count) || count < 1) {
      return AdminView.showRosterError("Informe uma quantidade válida de estudantes.");
    }
    try {
      const { loaded, students } = await ApiClient.generateRoster(this.#password, count);
      this.#roster = students;
      AdminView.renderRosterTable(students);
      AdminView.setDownloadRosterEnabled(true);
      AdminView.setRosterStatus(`${loaded} logins gerados. Exemplo: ${students[0].login} / ${students[0].senha}`);
      AdminView.setCsvStatus("gerado automaticamente");
      await this.#refreshResults();
    } catch (error) {
      AdminView.showRosterError(error.message);
    }
  }

  #handleDownloadRoster() {
    if (this.#roster.length === 0) return;
    const lines = ["login,senha", ...this.#roster.map((s) => `${s.login},${s.senha}`)];
    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "estudantes_prova.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  #showAdmin() {
    ScreenView.show("screen-admin");
  }

  #leave() {
    this.#password = null;
    ScreenView.show("screen-login");
  }

  async #handleSaveConfig() {
    AdminView.clearConfigError();
    const { questionCount, timeMinutes, allowRetakeAll } = AdminView.readConfig();
    try {
      const config = await ApiClient.updateConfig(this.#password, questionCount, timeMinutes, allowRetakeAll);
      AdminView.renderConfig(config);
    } catch (error) {
      AdminView.showConfigError(error.message);
    }
  }

  async #handleAddStudent() {
    AdminView.showAddStudentError("");
    const { login, senha, allowRetake } = AdminView.readNewStudent();
    if (!login || !senha) {
      return AdminView.showAddStudentError("Informe login e senha.");
    }
    try {
      await ApiClient.createStudent(this.#password, { login, senha, allow_retake: allowRetake });
      AdminView.clearNewStudentForm();
      await this.#refreshRoster();
    } catch (error) {
      AdminView.showAddStudentError(error.message);
    }
  }

  #handleEditStudent(studentId) {
    const student = this.#roster.find((item) => item.id === studentId);
    if (!student) return;
    AdminView.openStudentEditor(student);
  }

  async #handleSaveStudentEdit() {
    AdminView.showStudentEditError("");
    const { studentId, login, senha, allowRetake } = AdminView.readStudentEditor();
    if (!login || !senha) {
      return AdminView.showStudentEditError("Informe login e senha.");
    }
    try {
      await ApiClient.updateStudent(this.#password, studentId, {
        login,
        senha,
        allow_retake: allowRetake,
      });
      AdminView.closeStudentEditor();
      await this.#refreshRoster();
    } catch (error) {
      AdminView.showStudentEditError(error.message);
    }
  }

  async #handleCsvSelected(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    AdminView.clearRosterError();
    try {
      const { loaded } = await ApiClient.uploadRoster(this.#password, file);
      AdminView.setCsvStatus(`${file.name} · ${loaded} estudante(s)`);
      await this.#refreshRoster();
      await this.#refreshResults();
    } catch (error) {
      AdminView.setCsvStatus("Falha na importação");
      AdminView.showRosterError(error.message);
    } finally {
      input.value = "";
    }
  }

  #handleExport() {
    ApiClient.listResults(this.#password)
      .then(() => fetch(ApiClient.resultsCsvUrl(), { headers: { "X-Professor-Password": this.#password } }))
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao exportar.");
        return response.text();
      })
      .then((csv) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "resultados_prova.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => window.alert(error.message));
  }

  async #handleGabarito() {
    try {
      const items = await ApiClient.listGabarito(this.#password);
      GabaritoView.render(items);
      ScreenView.show("screen-gab");
    } catch (error) {
      window.alert(error.message);
    }
  }
}
