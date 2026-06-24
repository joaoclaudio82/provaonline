import { Config } from "../config/Config.js";

// Única camada que conversa com o backend. Lança Error com mensagem amigável
// quando a API responde com falha, para a View exibir.
async function request(path, { method = "GET", body, professorPassword, raw = false } = {}) {
  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (professorPassword) headers["X-Professor-Password"] = professorPassword;

  const response = await fetch(`${Config.API_BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = `Erro ${response.status}.`;
    try {
      const data = await response.json();
      if (data?.detail) detail = typeof data.detail === "string" ? data.detail : detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (raw) return response;
  if (response.status === 204) return null;
  return response.json();
}

export const ApiClient = Object.freeze({
  // ---- Aluno ----
  startExam(login, senha) {
    return request("/api/exam/start", { method: "POST", body: { login, senha } });
  },
  submitExam(payload) {
    return request("/api/exam/submit", { method: "POST", body: payload });
  },

  // ---- Professor ----
  getConfig(password) {
    return request("/api/admin/config", { professorPassword: password });
  },
  updateConfig(password, questionCount, timeMinutes) {
    return request("/api/admin/config", {
      method: "PUT",
      professorPassword: password,
      body: { question_count: questionCount, time_minutes: timeMinutes },
    });
  },
  uploadRoster(password, file) {
    const form = new FormData();
    form.append("file", file);
    return request("/api/admin/roster", { method: "POST", professorPassword: password, body: form });
  },
  listRoster(password) {
    return request("/api/admin/roster", { professorPassword: password });
  },
  generateRoster(password, count) {
    return request("/api/admin/roster/generate", {
      method: "POST",
      professorPassword: password,
      body: { count },
    });
  },
  listResults(password) {
    return request("/api/admin/results", { professorPassword: password });
  },
  resultsCsvUrl() {
    return `${Config.API_BASE}/api/admin/results.csv`;
  },
  listGabarito(password) {
    return request("/api/admin/gabarito", { professorPassword: password });
  },
  listQuestions(password) {
    return request("/api/admin/questions", { professorPassword: password });
  },
  createQuestion(password, body) {
    return request("/api/admin/questions", {
      method: "POST",
      professorPassword: password,
      body,
    });
  },
  updateQuestion(password, questionId, body) {
    return request(`/api/admin/questions/${questionId}`, {
      method: "PUT",
      professorPassword: password,
      body,
    });
  },
  deleteQuestion(password, questionId) {
    return request(`/api/admin/questions/${questionId}`, {
      method: "DELETE",
      professorPassword: password,
    });
  },
});
