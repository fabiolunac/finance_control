# Controle de Gastos 💰

App de controle de gastos pessoal. Funciona como **aplicativo instalável** (PWA) e os
dados ficam num **backend próprio**, sincronizados entre todos os dispositivos que você usar.

## Arquitetura

```
GitHub Pages (frontend estático)  --HTTPS-->  Render (API FastAPI + pandas)  --libSQL-->  Turso (banco SQLite hospedado)
```

| Arquivo/pasta | Para que serve |
|---|---|
| `index.html`, `style.css`, `script.js` | O app (PWA) |
| `manifest.json`, `sw.js` | Deixam o app instalável e com cache offline dos arquivos estáticos |
| `server/main.py` | API FastAPI que lê/grava no banco |
| `server/transform_db.py` | Pré-processamento com pandas: categoriza cada gasto, detecta pagamentos do CERN, calcula mês de referência do pagamento e saldo |
| `finance_control.db` | Banco original (snapshot histórico da tabela `gastos`) — a partir do deploy, quem manda é o Turso |
| `local_param.db` | Tabela `param` original (Local → Categoria/Categoria Geral) — mesma lógica, importada uma vez pro Turso |

Os dados sempre vêm/vão pela API — não há mais `localStorage` guardando os gastos, então
funciona offline só pra abrir o app, não pra ver/adicionar gastos sem rede.

A cada leitura, a API busca as tabelas `gastos` e `param` no Turso, roda `prepare_data()`
(pandas) e devolve pro frontend a tabela já enriquecida: `Categoria`, `Categoria Geral`,
`Pagamento?`, `Mês Pagamento`, `Ano Pagamento`, `Saldo`. Lançamentos do CERN com valor
acima de 3000 são tratados como pagamento — aparecem na tabela, mas saem da soma do total.

## Deploy

### 1. Banco de dados no Turso

```bash
# instale a CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create finance-control --from-file finance_control.db

# importa a tabela `param` (Local -> Categoria) pro MESMO banco:
sqlite3 local_param.db ".dump param" | turso db shell finance-control

turso db show finance-control --url      # -> TURSO_DATABASE_URL
turso db tokens create finance-control   # -> TURSO_AUTH_TOKEN
```

### 2. API no Render

1. Crie um Web Service novo em [render.com](https://render.com), apontando pro seu fork/clone deste repositório (ou reconfigure o serviço existente, se já tiver um do backend anterior em Node).
2. **Root Directory**: `server`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Configure as variáveis de ambiente (aba *Environment*):
   - `TURSO_DATABASE_URL` (do passo 1)
   - `TURSO_AUTH_TOKEN` (do passo 1)
   - `API_TOKEN` — invente um código de acesso forte, é o que o app vai pedir na primeira vez que abrir
   - `ALLOWED_ORIGIN` — a URL do seu GitHub Pages, ex: `https://seu-usuario.github.io`
6. Deploy. Anote a URL gerada (ex: `https://finance-control-api.onrender.com`).

### 3. Frontend no GitHub Pages

1. Abra [script.js](script.js) e confira se a constante `API_URL` aponta pra URL do Render do passo anterior.
2. Faça commit e push.
3. No repositório, **Settings → Pages** → Source: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
4. Seu app estará em `https://SEU-USUARIO.github.io/finance_control/`.

Na primeira vez que abrir o app (ou depois de limpar dados do site), ele vai pedir o
**código de acesso** — use o mesmo valor que você colocou em `API_TOKEN` no Render.

## Instalar como aplicativo

- **Android (Chrome):** menu ⋮ → *Adicionar à tela inicial* (ou o botão "Instalar como aplicativo" que aparece no app).
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*.
- **PC (Chrome/Edge):** ícone de instalar na barra de endereço.

## Rodando localmente

Backend:

```bash
cd server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edite .env: pra testar sem Turso, use TURSO_DATABASE_URL=file:../finance_control.db
# (nesse modo local, o arquivo apontado precisa ter as tabelas gastos e param juntas)
uvicorn main:app --reload --port 3000
```

Frontend (em outro terminal, na raiz do projeto):

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Troque temporariamente `API_URL` em `script.js` para
`http://localhost:3000` enquanto testa localmente.

## Quando você atualizar o site

Sempre que mudar `index.html`, `style.css`, `script.js` ou `manifest.json`, abra o `sw.js`
e aumente a versão na primeira linha (`controle-gastos-v4` → `v5`), pra forçar o navegador
a baixar os arquivos novos em vez de usar os antigos do cache.
