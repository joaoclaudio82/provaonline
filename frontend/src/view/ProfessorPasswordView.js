// Modal de senha do professor. Substitui window.prompt, que não funciona em vários
// navegadores embutidos (retorna string vazia sem exibir diálogo).
export const ProfessorPasswordView = Object.freeze({
  ask({ error = "" } = {}) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("prof-overlay");
      const input = document.getElementById("prof-password");
      const errorBox = document.getElementById("prof-err");
      const submitButton = document.getElementById("prof-submit");
      const cancelButton = document.getElementById("prof-cancel");

      errorBox.textContent = error;
      input.value = "";
      overlay.classList.add("show");
      input.focus();

      const cleanup = () => {
        overlay.classList.remove("show");
        submitButton.removeEventListener("click", onSubmit);
        cancelButton.removeEventListener("click", onCancel);
        input.removeEventListener("keydown", onKeyDown);
      };

      const onSubmit = () => {
        const password = input.value;
        if (!password) {
          errorBox.textContent = "Informe a senha.";
          return;
        }
        cleanup();
        resolve(password);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onKeyDown = (event) => {
        if (event.key === "Enter") onSubmit();
        if (event.key === "Escape") onCancel();
      };

      submitButton.addEventListener("click", onSubmit);
      cancelButton.addEventListener("click", onCancel);
      input.addEventListener("keydown", onKeyDown);
    });
  },
});
