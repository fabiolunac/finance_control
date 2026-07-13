require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, API_TOKEN, ALLOWED_ORIGIN, PORT } = process.env;

if (!TURSO_DATABASE_URL || !API_TOKEN) {
  console.error('Faltam variáveis de ambiente: TURSO_DATABASE_URL e/ou API_TOKEN.');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN || '*' }));
app.use(express.json());

app.use((req, res, next) => {
  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token !== API_TOKEN) {
    return res.status(401).json({ erro: 'Token inválido ou ausente.' });
  }
  next();
});

function mesAtual() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

// GET /api/gastos?mes=YYYY-MM — lista os lançamentos do mês + total
app.get('/api/gastos', async (req, res) => {
  try {
    const verTudo = req.query.todos === '1';
    const mes = /^\d{4}-\d{2}$/.test(req.query.mes || '') ? req.query.mes : mesAtual();
    const condMes = verTudo ? null : `strftime('%Y-%m', Data) = ?`;
    const args = verTudo ? [] : [mes];

    // Pagamentos (ex: recebimento do CERN) não contam como gasto na soma.
    const naoEhPagamento = `NOT (Local = 'CERN' AND Valor > 3400)`;

    const whereLista = condMes ? `WHERE ${condMes}` : '';
    const whereTotal = `WHERE ${[condMes, naoEhPagamento].filter(Boolean).join(' AND ')}`;

    const [linhas, total] = await Promise.all([
      db.execute({
        sql: `SELECT rowid, Data, Local, Valor, banco, tipo FROM gastos
              ${whereLista}
              ORDER BY Data DESC, rowid DESC`,
        args,
      }),
      db.execute({
        sql: `SELECT COALESCE(SUM(Valor), 0) AS total FROM gastos ${whereTotal}`,
        args,
      }),
    ]);

    res.json({
      mes: verTudo ? null : mes,
      total: total.rows[0].total,
      gastos: linhas.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao consultar o banco de dados.' });
  }
});

// POST /api/gastos — adiciona um lançamento { Data, Local, Valor }
app.post('/api/gastos', async (req, res) => {
  try {
    const { Data, Local, Valor } = req.body || {};

    if (!Data || !Local || typeof Valor !== 'number' || Number.isNaN(Valor)) {
      return res.status(400).json({ erro: 'Campos obrigatórios: Data (YYYY-MM-DD), Local (texto), Valor (número).' });
    }

    await db.execute({
      sql: `INSERT INTO gastos (Data, Local, Valor) VALUES (?, ?, ?)`,
      args: [`${Data} 00:00:00`, Local, Valor],
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao gravar no banco de dados.' });
  }
});

// DELETE /api/gastos/:rowid — remove um lançamento
app.delete('/api/gastos/:rowid', async (req, res) => {
  try {
    const rowid = Number(req.params.rowid);
    if (!Number.isInteger(rowid)) {
      return res.status(400).json({ erro: 'rowid inválido.' });
    }

    await db.execute({
      sql: `DELETE FROM gastos WHERE rowid = ?`,
      args: [rowid],
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao gravar no banco de dados.' });
  }
});

const porta = PORT || 3000;
app.listen(porta, () => console.log(`API do Controle de Gastos rodando na porta ${porta}`));
