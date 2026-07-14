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
const abaGraficos = document.getElementById('aba-graficos');
const secaoTabela = document.getElementById('secao-tabela');
const secaoAdicionar = document.getElementById('secao-adicionar');
const secaoGraficos = document.getElementById('secao-graficos');

const graficoCategoria = document.getElementById('grafico-categoria');
const graficoCategoriaGeral = document.getElementById('grafico-categoria-geral');
const graficoLocal = document.getElementById('grafico-local');
const graficoMensal = document.getElementById('grafico-mensal');
const graficoVazio = document.getElementById('grafico-vazio');

const graficoDiaMes = document.getElementById('grafico-dia-mes');
const graficoDiario = document.getElementById('grafico-diario');
const graficoDiarioVazio = document.getElementById('grafico-diario-vazio');

const filtroMes = document.getElementById('filtro-mes');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroCategoriaGeral = document.getElementById('filtro-categoria-geral');
const filtroLocal = document.getElementById('filtro-local');

const formGasto = document.getElementById('form-gasto');
const campoData = document.getElementById('campo-data');
const campoLocal = document.getElementById('campo-local');
const campoValor = document.getElementById('campo-valor');
const campoMoeda = document.getElementById('campo-moeda');
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
    preencherFiltrosGrafico();
    preencherSugestoes();
    aplicarFiltros();
    if (!secaoGraficos.hidden) atualizarGraficos();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

// ---------- Filtros ----------

function valoresUnicos(campo) {
  return [...new Set(todosGastos.map((g) => g[campo]))];
}

// ---------- Multiselect (checkboxes) ----------

const todosMultiSelects = [];

function multiSelectCombina(root, valor) {
  return root.selecionados.size === 0 || root.selecionados.has(valor);
}

function fecharMultiSelects(exceto) {
  todosMultiSelects.forEach((root) => {
    if (root === exceto) return;
    root._painel.hidden = true;
    root._botao.classList.remove('multiselect-aberto');
  });
}

document.addEventListener('click', () => fecharMultiSelects());

function atualizarTextoMultiSelect(root, campo, rotuloTodos) {
  const n = root.selecionados.size;
  root._texto.textContent = n === 0
    ? rotuloTodos
    : n === 1
      ? [...root.selecionados][0]
      : `${campo} (${n})`;
}

function criarMultiSelect(root) {
  const rotulo = root.getAttribute('aria-label') || '';
  root.classList.add('multiselect');
  root.selecionados = new Set();
  root.innerHTML = '';

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'multiselect-botao';
  if (rotulo) botao.setAttribute('aria-label', rotulo);

  const texto = document.createElement('span');
  texto.className = 'multiselect-texto';
  const seta = document.createElement('span');
  seta.className = 'multiselect-seta';
  seta.setAttribute('aria-hidden', 'true');
  seta.textContent = '▾';
  botao.append(texto, seta);

  const painel = document.createElement('div');
  painel.className = 'multiselect-painel';
  painel.hidden = true;

  botao.addEventListener('click', (evento) => {
    evento.stopPropagation();
    const vaiAbrir = painel.hidden;
    fecharMultiSelects(root);
    painel.hidden = !vaiAbrir;
    botao.classList.toggle('multiselect-aberto', vaiAbrir);
  });
  painel.addEventListener('click', (evento) => evento.stopPropagation());

  root.append(botao, painel);
  root._botao = botao;
  root._texto = texto;
  root._painel = painel;
  todosMultiSelects.push(root);
}

function popularMultiSelect(root, valores, rotuloTodos, campo, aoMudar) {
  root.selecionados = new Set([...root.selecionados].filter((v) => valores.includes(v)));
  root._painel.innerHTML = '';

  valores.forEach((valor) => {
    const item = document.createElement('label');
    item.className = 'multiselect-item';

    const caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.value = valor;
    caixa.checked = root.selecionados.has(valor);
    caixa.addEventListener('change', () => {
      if (caixa.checked) root.selecionados.add(valor);
      else root.selecionados.delete(valor);
      atualizarTextoMultiSelect(root, campo, rotuloTodos);
      aoMudar();
    });

    const span = document.createElement('span');
    span.textContent = valor;

    item.append(caixa, span);
    root._painel.appendChild(item);
  });

  atualizarTextoMultiSelect(root, campo, rotuloTodos);
}

[filtroMes, filtroCategoria, filtroCategoriaGeral, filtroLocal,
  graficoCategoria, graficoCategoriaGeral, graficoLocal].forEach(criarMultiSelect);

function preencherFiltros() {
  popularMultiSelect(filtroMes, valoresUnicos('Mês Pagamento').sort().reverse(), 'Mês: todos', 'Mês', aplicarFiltros);
  popularMultiSelect(filtroCategoria, valoresUnicos('Categoria').sort((a, b) => a.localeCompare(b)), 'Categoria: todas', 'Categoria', aplicarFiltros);
  popularMultiSelect(filtroCategoriaGeral, valoresUnicos('Categoria Geral').sort((a, b) => a.localeCompare(b)), 'Categoria geral: todas', 'Categoria geral', aplicarFiltros);
  popularMultiSelect(filtroLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)), 'Local: todos', 'Local', aplicarFiltros);
}

function aplicarFiltros() {
  const filtrados = todosGastos.filter((g) =>
    multiSelectCombina(filtroMes, g['Mês Pagamento']) &&
    multiSelectCombina(filtroCategoria, g.Categoria) &&
    multiSelectCombina(filtroCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(filtroLocal, g.Local)
  );
  renderizar(filtrados);
}

// ---------- Abas ----------

const abas = [
  [abaTabela, secaoTabela],
  [abaAdicionar, secaoAdicionar],
  [abaGraficos, secaoGraficos],
];

function selecionarAba(abaEscolhida) {
  abas.forEach(([aba, secao]) => {
    aba.classList.toggle('aba-ativa', aba === abaEscolhida);
    secao.hidden = aba !== abaEscolhida;
  });
  erro.hidden = true;
  sucesso.hidden = true;
  if (abaEscolhida === abaGraficos) atualizarGraficos();
}

abas.forEach(([aba]) => aba.addEventListener('click', () => selecionarAba(aba)));

// ---------- Gráficos ----------

function atualizarGraficos() {
  renderizarGrafico();
  renderizarGraficoDiario();
}

function preencherFiltrosGrafico() {
  popularMultiSelect(graficoCategoria, valoresUnicos('Categoria').sort((a, b) => a.localeCompare(b)), 'Categoria: todas', 'Categoria', atualizarGraficos);
  popularMultiSelect(graficoCategoriaGeral, valoresUnicos('Categoria Geral').sort((a, b) => a.localeCompare(b)), 'Categoria geral: todas', 'Categoria geral', atualizarGraficos);
  popularMultiSelect(graficoLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)), 'Local: todos', 'Local', atualizarGraficos);
  preencherFiltroDiario();
}

function renderizarBarras(container, entradas) {
  const maximo = Math.max(...entradas.map(([, valorTotal]) => valorTotal), 0);
  container.innerHTML = '';

  entradas.forEach(([rotuloTexto, valorTotal]) => {
    const linha = document.createElement('div');
    linha.className = 'barra-linha';

    const rotulo = document.createElement('span');
    rotulo.className = 'barra-rotulo';
    rotulo.textContent = rotuloTexto;

    const trilha = document.createElement('div');
    trilha.className = 'barra-trilha';
    const barra = document.createElement('div');
    barra.className = 'barra';
    barra.style.width = maximo ? `${(valorTotal / maximo) * 100}%` : '0%';
    trilha.appendChild(barra);

    const valor = document.createElement('span');
    valor.className = 'barra-valor';
    valor.textContent = formatarMoeda(valorTotal);

    linha.append(rotulo, trilha, valor);
    container.appendChild(linha);
  });
}

function gastosFiltradosGrafico() {
  // Só gastos de verdade: pagamentos (salário CERN) ficam fora da soma.
  return todosGastos.filter((g) =>
    g['Pagamento?'] !== 'Sim' &&
    multiSelectCombina(graficoCategoria, g.Categoria) &&
    multiSelectCombina(graficoCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(graficoLocal, g.Local)
  );
}

function renderizarGrafico() {
  const filtrados = gastosFiltradosGrafico();

  const totais = {};
  filtrados.forEach((g) => {
    totais[g['Mês Pagamento']] = (totais[g['Mês Pagamento']] || 0) + g.Valor;
  });

  const meses = Object.keys(totais).sort();
  graficoVazio.hidden = meses.length > 0;
  renderizarBarras(graficoMensal, meses.map((mes) => [mes, totais[mes]]));
}

function preencherFiltroDiario() {
  const meses = valoresUnicos('Mês Pagamento').sort().reverse();
  const atual = graficoDiaMes.value;

  graficoDiaMes.innerHTML = '';
  meses.forEach((mes) => {
    const opcao = document.createElement('option');
    opcao.value = mes;
    opcao.textContent = mes;
    graficoDiaMes.appendChild(opcao);
  });

  if (meses.includes(atual)) graficoDiaMes.value = atual;
}

function renderizarGraficoDiario() {
  const filtrados = gastosFiltradosGrafico().filter((g) => g['Mês Pagamento'] === graficoDiaMes.value);

  const totais = {};
  filtrados.forEach((g) => {
    const data = g.Data.slice(0, 10);
    totais[data] = (totais[data] || 0) + g.Valor;
  });

  const datas = Object.keys(totais).sort();
  graficoDiarioVazio.hidden = datas.length > 0;

  const entradas = datas.map((data) => {
    const [, mes, dia] = data.split('-');
    return [`${dia}/${mes}`, totais[data]];
  });
  renderizarBarras(graficoDiario, entradas);
}

graficoDiaMes.addEventListener('change', renderizarGraficoDiario);

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

async function converterEurParaChf(valorEur) {
  const resposta = await fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=CHF');
  if (!resposta.ok) throw new Error('Não foi possível obter a cotação EUR → CHF.');
  const { rates } = await resposta.json();
  if (!rates || !rates.CHF) throw new Error('Não foi possível obter a cotação EUR → CHF.');
  return valorEur * rates.CHF;
}

async function adicionar(evento) {
  evento.preventDefault();
  erro.hidden = true;
  sucesso.hidden = true;

  const valorDigitado = parseFloat(campoValor.value);
  const moeda = campoMoeda.value;

  const gasto = {
    Data: campoData.value,
    Local: campoLocal.value.trim(),
    tipo: campoTipo.value.trim(),
    banco: campoBanco.value.trim(),
  };

  if (!gasto.Data || !gasto.Local || Number.isNaN(valorDigitado) || !gasto.tipo || !gasto.banco) return;

  try {
    gasto.Valor = moeda === 'EUR' ? await converterEurParaChf(valorDigitado) : valorDigitado;

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
    campoMoeda.value = 'CHF';
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
      formatarMoeda(gasto.Valor),
      gasto.Categoria,
      gasto['Categoria Geral'],
      // gasto.banco,
      gasto.tipo,
      // formatarMoeda(gasto.Saldo),
      gasto['Mês Pagamento'],
    ];

    celulas.forEach((texto, i) => {
      const td = document.createElement('td');
      td.textContent = texto;
      if (i === 2) td.className = 'col-valor';
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'col-acoes';
    const botaoRemover = document.createElement('button');
    botaoRemover.type = 'button';
    botaoRemover.className = 'botao-remover';
    botaoRemover.textContent = '×';
    botaoRemover.setAttribute('aria-label', `Remover gasto de ${gasto.Local}`);
    botaoRemover.addEventListener('click', () => removerGasto(gasto.rowid, gasto.Local));
    tdAcoes.appendChild(botaoRemover);
    tr.appendChild(tdAcoes);

    corpoTabela.appendChild(tr);
  });
}

async function removerGasto(rowid, local) {
  if (!confirm(`Remover o gasto "${local}"? Essa ação não pode ser desfeita.`)) return;

  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/gastos/${rowid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao remover no servidor.');
    }

    await carregar();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
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
