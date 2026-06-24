// Leitura e escrita de CSV isoladas em um só lugar.
export const CsvCodec = Object.freeze({
  // Texto CSV -> [{ login, senha }]. Aceita vírgula ou ponto e vírgula e cabeçalho opcional.
  parseRoster(rawText) {
    const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const students = [];
    for (const line of lines) {
      const columns = line.split(/[;,]/).map((col) => col.trim().replace(/^"|"$/g, ""));
      if (columns.length < 2) continue;
      const isHeader = /^login$/i.test(columns[0]);
      if (isHeader) continue;
      students.push({ login: columns[0], senha: columns[1] });
    }
    return students;
  },

  // Lista de resultados -> string CSV pronta para download (com BOM para Excel).
  buildResultsCsv(results) {
    const header = [
      "login", "acertos", "total", "nota", "violacoes", "tempo_s",
      "encerrado_por", "questoes_banco", "respostas_aluno", "gabarito", "data",
    ];
    const rows = [header.join(",")];
    for (const r of results) {
      rows.push([
        r.login, r.correctCount, r.total, r.grade, r.violations, r.elapsedSeconds,
        r.finishedBy, `"${r.bankNumbers}"`, `"${r.studentAnswers}"`, `"${r.answerKey}"`, r.isoDate,
      ].join(","));
    }
    return "\ufeff" + rows.join("\n");
  },
});
