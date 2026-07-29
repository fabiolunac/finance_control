# Controle de Gastos 💰

Visualizador da tabela de gastos, já tratada com pandas no backend.
Instalável como aplicativo (PWA), dados sincronizados via API.

## Arquitetura

```
GitHub Pages (frontend estático)  --HTTPS-->  Render (API FastAPI + pandas)  --libSQL-->  Turso (banco SQLite hospedado)
```

| Arquivo/pasta | Para que serve |
|---|---|
| `index.html`, `style.css`, `script.js` | O site: uma página só, com a tabela final |
| `manifest.json`, `sw.js` | Deixam o app instalável e com cache dos arquivos estáticos |
| `server/main.py` | API FastAPI: um endpoint (`GET /api/gastos`) que devolve a tabela tratada |
| `server/transform_db.py` | Pré-processamento com pandas: Categoria, Categoria Geral e Mês (calendário) |
| `finance_control.db`, `local_param.db` | Bancos originais da fase Suíça (fora do git) — hoje preservados no Turso como `gastos_ch`/`param_ch` |

A cada leitura, a API busca `gastos` e `param` no Turso, roda `prepare_data()` e devolve a
tabela completa em R$. Locais sem categoria cadastrada na `param` entram como "Extra".

O histórico da fase Suíça (CHF, salário CERN, saldo) ficou nas tabelas `gastos_ch`/`param_ch`
do mesmo banco Turso — o código dessa fase está no histórico do git, antes desta versão BR.

## Deploy

### 1. Banco no Turso

```bash
turso auth login
turso db create finance-control --from-file finance_control.db
sqlite3 local_param.db ".dump param" | turso db shell finance-control

turso db show finance-control --url      # -> TURSO_DATABASE_URL
turso db tokens create finance-control   # -> TURSO_AUTH_TOKEN
```

### 2. API no Render

Web Service apontando pra este repositório:

- **Root Directory**: `server`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `API_TOKEN` (código de acesso do app), `ALLOWED_ORIGIN` (URL do GitHub Pages)

### 3. Frontend no GitHub Pages

`API_URL` no [script.js](script.js) aponta pra URL do Render. Push na `main` publica.

Na primeira vez que abrir o app, ele pede o **código de acesso** — o mesmo valor de `API_TOKEN`.

## Rodando localmente

```bash
cd server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # em modo local use TURSO_DATABASE_URL=file:<db com as tabelas gastos e param>
uvicorn main:app --reload --port 3000
```

Frontend: `python3 -m http.server 8000` na raiz e troque `API_URL` para `http://localhost:3000`.

## Quando você atualizar o site

Sempre que mudar `index.html`, `style.css`, `script.js` ou `manifest.json`, aumente a
versão na primeira linha do `sw.js` (`controle-gastos-v5` → `v6`), pra forçar o navegador
a baixar os arquivos novos.
