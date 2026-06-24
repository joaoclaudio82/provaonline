// Controla qual tela está visível. Único ponto que liga/desliga seções.
export const ScreenView = Object.freeze({
  _ids: ["screen-rules", "screen-login", "screen-admin", "screen-questions", "screen-gab", "screen-exam", "screen-done"],

  show(targetId) {
    this._ids.forEach((id) => document.getElementById(id).classList.add("hide"));
    document.getElementById(targetId).classList.remove("hide");
  },
});
