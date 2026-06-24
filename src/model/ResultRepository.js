import { Config } from "../config/Config.js";

// Única camada que conversa com o armazenamento (localStorage).
// Trocar por uma API REST significa reescrever só este arquivo.
export const ResultRepository = Object.freeze({
  findAll() {
    try {
      return JSON.parse(localStorage.getItem(Config.STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  },

  hasSubmitted(login) {
    return this.findAll().some((result) => result.login === login);
  },

  save(result) {
    const all = this.findAll();
    all.push(result);
    localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(all));
  },

  clear() {
    localStorage.removeItem(Config.STORAGE_KEY);
  },
});
