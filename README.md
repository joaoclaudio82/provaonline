# Prova Online — Algoritmos e Reconhecimento de Padrões

Sistema de prova objetiva com login por estudante, sorteio individual de questões,
travas de tela e correção automática. Há duas formas de uso:

- **Cliente-servidor (recomendado):** backend em FastAPI + PostgreSQL e front que
  consome a API. O gabarito fica só no servidor; a correção é feita no backend.
  Indicado para turmas distribuídas. Sobe tudo com Docker.
- **Standalone (offline):** a versão em `index.html` + `src/` roda só no navegador,
  sem backend, guardando resultados no próprio navegador. Útil para teste rápido,
  mas o gabarito vai junto para o cliente.

Este README cobre principalmente o modo cliente-servidor.

## Subir tudo com Docker

Pré-requisitos: Docker e Docker Compose.

```bash
# 1. Defina a senha do professor (ou edite no docker-compose / .env)
export PROFESSOR_PASSWORD="uma-senha-forte"

# 2. Suba os três serviços: PostgreSQL, backend e front
docker compose up --build
```

- Front: http://localhost:8080
- API (documentação automática): http://localhost:8000/docs

Na primeira subida, o backend cria as tabelas e popula o banco de questões.

> O front detecta automaticamente a URL da API: em Docker local (front :8080/:8081)
> usa a API em :8000/:8001; em produção (mesmo domínio) usa a origem atual.

## Deploy no Railway

**Não publique a pasta raiz como site estático.** Isso serve a versão standalone
(`index.html` + `src/`), que **não tem senha de professor** e expõe o gabarito no
navegador.

Use o `Dockerfile` na raiz do repositório (FastAPI + front + PostgreSQL):

1. Crie um serviço **Docker** apontando para este repositório (o `railway.toml` já
   referencia o `Dockerfile` da raiz).
2. Adicione o plugin **PostgreSQL** e vincule `DATABASE_URL` ao serviço da API.
3. Defina a variável **`PROFESSOR_PASSWORD`** com uma senha forte (obrigatória).
4. Faça redeploy. A aplicação ficará em um único domínio, ex.:
   `https://provaonline-production.up.railway.app`

A área do professor só abre após validar a senha contra a API; sem
`PROFESSOR_PASSWORD` configurada, os endpoints administrativos retornam erro 503.

## Como usar

1. Abra o front. A tela de regras aparece primeiro; o estudante precisa aceitar.
2. Em Área do professor, informe a senha (a do .env). Lá você:
   - define quantidade de questões e tempo em minutos e salva;
   - envia o CSV da turma (duas colunas login,senha, uma por linha, até 50).
     Enviar um novo CSV recria a turma e zera provas e resultados anteriores;
   - acompanha os resultados e baixa o CSV consolidado;
   - consulta o gabarito comentado (só aqui).
3. Cada estudante faz login: o backend sorteia as questões na primeira entrada,
   entrega sem o gabarito, e devolve a mesma prova se ele recarregar. A prova é
   só com o mouse, com véu de borrão e advertências registradas.
4. Ao enviar (ou esgotar o tempo), o backend corrige e grava o resultado. O
   aluno não pode reenviar nem reabrir.

## Estrutura

```
prova-online/
├── docker-compose.yml          # sobe db + backend + front
├── frontend/                   # front que consome a API (cliente-servidor)
│   ├── index.html
│   ├── styles/main.css
│   └── src/
│       ├── main.js
│       ├── config/Config.js    # constantes de UI + API_BASE
│       ├── services/ApiClient.js   # única camada que fala com o backend
│       ├── model/ExamState.js  # estado local da prova (respostas)
│       ├── view/               # telas (regras, login, prova, admin, etc.)
│       └── controller/         # orquestração
├── backend/                    # API FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py             # app FastAPI, CORS, criação de tabelas e seed
│       ├── core/               # config (.env), segurança, conexão do banco
│       ├── models/entities.py  # tabelas SQLAlchemy
│       ├── schemas/dto.py      # contratos Pydantic (sem gabarito p/ o aluno)
│       ├── services/           # sorteio, correção, roster, seed
│       ├── routers/            # endpoints de aluno e de professor
│       └── data/questions.json # banco de questões com gabarito (no servidor)
├── index.html, styles/, src/   # versão STANDALONE (offline, sem backend)
└── exemplos/estudantes_exemplo.csv
```

## API (resumo)

Aluno:
- POST /api/exam/start — {login, senha} -> prova sem gabarito (sorteada).
- POST /api/exam/submit — {login, senha, answers, violations, finished_by} -> resultado.

Professor (cabeçalho X-Professor-Password):
- GET/PUT /api/admin/config — parâmetros da prova.
- POST /api/admin/roster — upload do CSV da turma.
- GET /api/admin/results e GET /api/admin/results.csv — resultados.
- GET /api/admin/gabarito — banco com gabarito.

## Por que a correção fica no servidor

No modo standalone, o questions.json (com gabarito) é baixado pelo navegador, o
que permite a um aluno ler as respostas pelo inspetor. No modo cliente-servidor isso
não acontece: o backend envia apenas enunciados e alternativas, recebe as marcações
e corrige do lado dele. Essa é a diferença de segurança que justifica o backend.

## Parâmetros e o que ficou de fora

A tela do professor define quantidade de questões e tempo em minutos, com validação
de faixa e persistência no banco. Por decisão de projeto, não há geração por LLM nem
grau de dificuldade nesta versão: o modelo é de banco fixo revisado, com correção
confiável. Se quiser dificuldade, etiquete as questões e filtre o sorteio; se quiser
LLM, gere e revise as questões pelo professor antes de salvar no banco.

## Observação sobre segurança (leia com atenção)

As travas e defesas anti-captura reduzem trapaça, mas não são uma barreira absoluta
em um navegador:

- Aviso e aceite das regras antes do login.
- Bloqueio de teclado; a prova é só com o mouse.
- Detecção de PrintScreen (best-effort): quando o navegador entrega a tecla, a
  tentativa é registrada e a tela é coberta por um véu.
- Véu de borrão ao perder o foco, trocar de aba ou tirar o mouse.
- Marca d'água com o login sobre a prova: qualquer captura fica rastreável.

O que não é possível em navegador puro: bloquear o print screen do sistema, impedir
foto de celular ou impedir a saída da tela cheia pela tecla do sistema. Por isso a
estratégia central é a marca d'água rastreável, não um bloqueio (que seria ilusório).
Para avaliação de alto risco, combine com supervisão presencial ou proctoring com
aplicativo dedicado.

## Standalone (offline)

Para rodar a versão sem backend, sirva a raiz por HTTP e abra o index.html:

```bash
python3 -m http.server 8000
```

Nessa versão os resultados ficam no localStorage do navegador e o gabarito é
embarcado no cliente.
