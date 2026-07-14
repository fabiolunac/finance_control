/* ============================================================
   Controle de Gastos — só visualização.
   Busca a tabela final já tratada (pandas no backend) e exibe,
   com filtros por mês de pagamento, categoria e local.
   ============================================================ */

const API_URL = 'https://finance-control-99hx.onrender.com';

const statusRede = document.getElementById('status-rede');
const corpoTabela = document.getElementById('corpo-tabela');
const vazio = document.getElementById('vazio');
const erro = document.getElementById('erro');

const abaTabela = document.getElementById('aba-tabela');
const abaAdicionar = document.getElementById('aba-adicionar');
const secaoTabela = document.getElementById('secao-tabela');
const secaoAdicionar = document.getElementById('secao-adicionar');

const filtroMes = document.getElementById('filtro-mes');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroCategoriaGeral = document.getElementById('filtro-categoria-geral');
const filtroLocal = document.getElementById('filtro-local');

const formGasto = document.getElementById('form-gasto');
const campoData = document.getElementById('campo-data');
const campoLocal = document.getElementById('campo-local');
const campoValor = document.getElementById('campo-valor');
const campoTipo = document.getElementById('campo-tipo');
const campoBanco = document.getElementById('campo-banco');
const opcoesTipo = document.getElementById('opcoes-tipo');
const opcoesBanco = document.getElementById('opcoes-banco');
const sucesso = document.getElementById('sucesso');

let todosGastos = [];

// ---------- Token de acesso ----------

function obterToken() {
  let token = localStorage.getItem('apiToken');
  if (!token) {
    token = prompt('Código de acesso do app:');
    if (token) localStorage.setItem('apiToken', token);
  }
  return token;
}

// ---------- Formatação ----------

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'CHF' });
}

function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// ---------- Carregamento ----------

async function carregar() {
  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/gastos`, {
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao falar com o servidor.');
    }

    const { gastos } = await resposta.json();
    todosGastos = gastos;
    preencherFiltros();
    preencherSugestoes();
    aplicarFiltros();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

// ---------- Filtros ----------

function valoresUnicos(campo) {
  return [...new Set(todosGastos.map((g) => g[campo]))];
}

function preencherSelect(select, valores, rotuloTodos) {
  const valorAtual = select.value;
  select.innerHTML = '';

  const todos = document.createElement('option');
  todos.value = '';
  todos.textContent = rotuloTodos;
  select.appendChild(todos);

  valores.forEach((valor) => {
    const opcao = document.createElement('option');
    opcao.value = valor;
    opcao.textContent = valor;
    select.appendChild(opcao);
  });

  select.value = valorAtual;
  if (select.selectedIndex === -1) select.value = '';
}

function preencherFiltros() {
  preencherSelect(filtroMes, valoresUnicos('Mês Pagamento').sort().reverse(), 'Mês: todos');
  preencherSelect(filtroCategoria, valoresUnicos('Categoria').sort((a, b) => a.localeCompare(b)), 'Categoria: todas');
  preencherSelect(filtroCategoriaGeral, valoresUnicos('Categoria Geral').sort((a, b) => a.localeCompare(b)), 'Categoria geral: todas');
  preencherSelect(filtroLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)), 'Local: todos');
}

function aplicarFiltros() {
  const filtrados = todosGastos.filter((g) =>
    (!filtroMes.value || g['Mês Pagamento'] === filtroMes.value) &&
    (!filtroCategoria.value || g.Categoria === filtroCategoria.value) &&
    (!filtroCategoriaGeral.value || g['Categoria Geral'] === filtroCategoriaGeral.value) &&
    (!filtroLocal.value || g.Local === filtroLocal.value)
  );
  renderizar(filtrados);
}

[filtroMes, filtroCategoria, filtroCategoriaGeral, filtroLocal].forEach((select) => {
  select.addEventListener('change', aplicarFiltros);
});

// ---------- Abas ----------

function selecionarAba(adicionar) {
  abaTabela.classList.toggle('aba-ativa', !adicionar);
  abaAdicionar.classList.toggle('aba-ativa', adicionar);
  secaoTabela.hidden = adicionar;
  secaoAdicionar.hidden = !adicionar;
  erro.hidden = true;
  sucesso.hidden = true;
}

abaTabela.addEventListener('click', () => selecionarAba(false));
abaAdicionar.addEventListener('click', () => selecionarAba(true));

// ---------- Adicionar gasto ----------

function preencherDatalist(datalist, valores) {
  datalist.innerHTML = '';
  valores.forEach((valor) => {
    const opcao = document.createElement('option');
    opcao.value = valor;
    datalist.appendChild(opcao);
  });
}

function preencherSugestoes() {
  preencherDatalist(opcoesTipo, valoresUnicos('tipo').sort((a, b) => a.localeCompare(b)));
  preencherDatalist(opcoesBanco, valoresUnicos('banco').sort((a, b) => a.localeCompare(b)));
}

async function adicionar(evento) {
  evento.preventDefault();
  erro.hidden = true;
  sucesso.hidden = true;

  const gasto = {
    Data: campoData.value,
    Local: campoLocal.value.trim(),
    Valor: parseFloat(campoValor.value),
    tipo: campoTipo.value.trim(),
    banco: campoBanco.value.trim(),
  };

  if (!gasto.Data || !gasto.Local || Number.isNaN(gasto.Valor) || !gasto.tipo || !gasto.banco) return;

  try {
    const resposta = await fetch(`${API_URL}/api/gastos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify(gasto),
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao gravar no servidor.');
    }

    sucesso.textContent = `Adicionado: ${gasto.Local} — ${formatarMoeda(gasto.Valor)} (${formatarData(gasto.Data)})`;
    sucesso.hidden = false;
    campoLocal.value = '';
    campoValor.value = '';
    campoLocal.focus();

    await carregar();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

formGasto.addEventListener('submit', adicionar);

// ---------- Renderização ----------

function renderizar(gastos) {
  corpoTabela.innerHTML = '';
  vazio.hidden = gastos.length > 0;

  gastos.forEach((gasto) => {
    const tr = document.createElement('tr');
    if (gasto['Pagamento?'] === 'Sim') tr.classList.add('linha-pagamento');

    const celulas = [
      formatarData(gasto.Data),
      gasto.Local,
      gasto.Categoria,
      gasto['Categoria Geral'],
      gasto.banco,
      gasto.tipo,
      formatarMoeda(gasto.Valor),
      formatarMoeda(gasto.Saldo),
      gasto['Mês Pagamento'],
    ];

    celulas.forEach((texto, i) => {
      const td = document.createElement('td');
      td.textContent = texto;
      if (i === 6 || i === 7) td.className = 'col-valor';
      tr.appendChild(td);
    });

    corpoTabela.appendChild(tr);
  });
}

// ---------- Indicador online/offline ----------

function atualizarRede() {
  const online = navigator.onLine;
  statusRede.textContent = online ? 'online' : 'offline';
  statusRede.className = 'badge ' + (online ? 'badge-online' : 'badge-offline');
}

window.addEventListener('online', () => { atualizarRede(); carregar(); });
window.addEventListener('offline', atualizarRede);

// ---------- Início ----------

campoData.value = new Date().toISOString().slice(0, 10);
atualizarRede();
carregar();
