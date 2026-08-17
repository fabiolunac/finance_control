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
const totalFiltrado = document.getElementById('total-filtrado');

const abaTabela = document.getElementById('aba-tabela');
const abaAdicionar = document.getElementById('aba-adicionar');
const abaGraficos = document.getElementById('aba-graficos');
const abaVisaoGeral = document.getElementById('aba-visao-geral');
const abaParametros = document.getElementById('aba-parametros');
const secaoTabela = document.getElementById('secao-tabela');
const secaoAdicionar = document.getElementById('secao-adicionar');
const secaoGraficos = document.getElementById('secao-graficos');
const secaoVisaoGeral = document.getElementById('secao-visao-geral');
const secaoParametros = document.getElementById('secao-parametros');

const metricaTotalGasto = document.getElementById('metrica-total-gasto');
const metricaLancamentos = document.getElementById('metrica-lancamentos');
const graficoCategoriasMes = document.getElementById('grafico-categorias-mes');
const visaoGeralVazio = document.getElementById('visao-geral-vazio');
const visaoSemanaMes = document.getElementById('visao-semana-mes');
const graficoSemanal = document.getElementById('grafico-semanal');
const graficoSemanalVazio = document.getElementById('grafico-semanal-vazio');
const botaoMesAtualSemana = document.getElementById('botao-mes-atual-semana');

const graficoCategoria = document.getElementById('grafico-categoria');
const graficoCategoriaGeral = document.getElementById('grafico-categoria-geral');
const graficoLocal = document.getElementById('grafico-local');
const graficoMensal = document.getElementById('grafico-mensal');
const graficoVazio = document.getElementById('grafico-vazio');

const graficoDiaMes = document.getElementById('grafico-dia-mes');
const graficoDiario = document.getElementById('grafico-diario');
const graficoDiarioVazio = document.getElementById('grafico-diario-vazio');
const botaoMesAtualDia = document.getElementById('botao-mes-atual-dia');

const filtroMes = document.getElementById('filtro-mes');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroCategoriaGeral = document.getElementById('filtro-categoria-geral');
const filtroLocal = document.getElementById('filtro-local');
const botaoMesAtual = document.getElementById('botao-mes-atual');

const formGasto = document.getElementById('form-gasto');
const campoData = document.getElementById('campo-data');
const campoLocal = document.getElementById('campo-local');
const campoValor = document.getElementById('campo-valor');
const campoTipo = document.getElementById('campo-tipo');
const campoBanco = document.getElementById('campo-banco');
const opcoesTipo = document.getElementById('opcoes-tipo');
const opcoesBanco = document.getElementById('opcoes-banco');
const sucesso = document.getElementById('sucesso');

const formParam = document.getElementById('form-param');
const campoParamLocal = document.getElementById('campo-param-local');
const campoParamCategoria = document.getElementById('campo-param-categoria');
const campoParamCategoriaGeral = document.getElementById('campo-param-categoria-geral');
const opcoesParamCategoria = document.getElementById('opcoes-param-categoria');
const opcoesParamCategoriaGeral = document.getElementById('opcoes-param-categoria-geral');
const corpoParam = document.getElementById('corpo-param');
const paramVazio = document.getElementById('param-vazio');
const paramSucesso = document.getElementById('param-sucesso');

let todosGastos = [];
let todosParam = [];
let paramCarregado = false;

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
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    preencherFiltroSemanal();
    preencherSugestoes();
    aplicarFiltros();
    if (!secaoGraficos.hidden) atualizarGraficos();
    if (!secaoVisaoGeral.hidden) renderizarVisaoGeral();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

// ---------- Filtros ----------

function valoresUnicos(campo) {
  return [...new Set(todosGastos.map((g) => g[campo]))];
}

function calcularTotalGasto(gastos) {
  const soma = (tipo) => gastos.filter((g) => g.tipo === tipo).reduce((s, g) => s + g.Valor, 0);
  return soma('Gasto') - soma('Pagamento');
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

function selecionarUnicoNoMultiSelect(root, valor, campo, rotuloTodos) {
  root.selecionados = new Set([valor]);
  root._painel.querySelectorAll('input[type="checkbox"]').forEach((caixa) => {
    caixa.checked = caixa.value === valor;
  });
  atualizarTextoMultiSelect(root, campo, rotuloTodos);
}

[filtroMes, filtroCategoria, filtroCategoriaGeral, filtroLocal,
  graficoCategoria, graficoCategoriaGeral, graficoLocal].forEach(criarMultiSelect);

botaoMesAtual.addEventListener('click', () => {
  selecionarUnicoNoMultiSelect(filtroMes, mesAtual(), 'Mês', 'Mês: todos');
  aplicarFiltros();
});

function preencherFiltros() {
  popularMultiSelect(filtroMes, valoresUnicos('Mês').sort().reverse(), 'Mês: todos', 'Mês', aplicarFiltros);
  popularMultiSelect(filtroCategoria, valoresUnicos('Categoria').sort((a, b) => a.localeCompare(b)), 'Categoria: todas', 'Categoria', aplicarFiltros);
  popularMultiSelect(filtroCategoriaGeral, valoresUnicos('Categoria Geral').sort((a, b) => a.localeCompare(b)), 'Categoria geral: todas', 'Categoria geral', aplicarFiltros);
  popularMultiSelect(filtroLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)), 'Local: todos', 'Local', aplicarFiltros);
}

function aplicarFiltros() {
  const filtrados = todosGastos.filter((g) =>
    multiSelectCombina(filtroMes, g['Mês']) &&
    multiSelectCombina(filtroCategoria, g.Categoria) &&
    multiSelectCombina(filtroCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(filtroLocal, g.Local)
  );
  renderizar(filtrados);
  totalFiltrado.textContent = formatarMoeda(calcularTotalGasto(filtrados));
}

// ---------- Abas ----------

const abas = [
  [abaTabela, secaoTabela],
  [abaAdicionar, secaoAdicionar],
  [abaGraficos, secaoGraficos],
  [abaVisaoGeral, secaoVisaoGeral],
  [abaParametros, secaoParametros],
];

function selecionarAba(abaEscolhida) {
  abas.forEach(([aba, secao]) => {
    aba.classList.toggle('aba-ativa', aba === abaEscolhida);
    secao.hidden = aba !== abaEscolhida;
  });
  erro.hidden = true;
  sucesso.hidden = true;
  paramSucesso.hidden = true;
  if (abaEscolhida === abaGraficos) atualizarGraficos();
  if (abaEscolhida === abaVisaoGeral) renderizarVisaoGeral();
  if (abaEscolhida === abaParametros) carregarParametros();
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
  return todosGastos.filter((g) =>
    g.tipo === 'Gasto' &&
    multiSelectCombina(graficoCategoria, g.Categoria) &&
    multiSelectCombina(graficoCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(graficoLocal, g.Local)
  );
}

function renderizarGrafico() {
  const filtrados = gastosFiltradosGrafico();

  const totais = {};
  filtrados.forEach((g) => {
    totais[g['Mês']] = (totais[g['Mês']] || 0) + g.Valor;
  });

  const meses = Object.keys(totais).sort();
  graficoVazio.hidden = meses.length > 0;
  renderizarBarras(graficoMensal, meses.map((mes) => [mes, totais[mes]]));
}

function preencherFiltroDiario() {
  const meses = valoresUnicos('Mês').sort().reverse();
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
  const filtrados = gastosFiltradosGrafico().filter((g) => g['Mês'] === graficoDiaMes.value);

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

botaoMesAtualDia.addEventListener('click', () => {
  graficoDiaMes.value = mesAtual();
  renderizarGraficoDiario();
});

// ---------- Visão geral ----------

function mesAtual() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function renderizarVisaoGeral() {
  const gastosMes = todosGastos.filter((g) => g['Mês'] === mesAtual());

  metricaTotalGasto.textContent = formatarMoeda(calcularTotalGasto(gastosMes));
  metricaLancamentos.textContent = String(gastosMes.length);

  const totais = {};
  gastosMes.filter((g) => g.tipo === 'Gasto').forEach((g) => {
    totais[g['Categoria Geral']] = (totais[g['Categoria Geral']] || 0) + g.Valor;
  });

  const categorias = Object.keys(totais).sort((a, b) => totais[b] - totais[a]);
  visaoGeralVazio.hidden = categorias.length > 0;
  renderizarBarras(graficoCategoriasMes, categorias.map((c) => [c, totais[c]]));

  renderizarGraficoSemanal();
}

// ---------- Gastos por semana ----------

function dataLocal(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarIso(data) {
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

// Segunda-feira da semana em que a data cai
function inicioSemana(data) {
  const inicio = new Date(data);
  inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7);
  return inicio;
}

// Segundas-feiras das semanas que cruzam o mês (YYYY-MM)
function semanasDoMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const fimDoMes = new Date(ano, m, 1);
  const semanas = [];
  const cursor = inicioSemana(new Date(ano, m - 1, 1));
  while (cursor < fimDoMes) {
    semanas.push(formatarIso(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return semanas;
}

function preencherFiltroSemanal() {
  const meses = valoresUnicos('Mês').sort().reverse();
  const atual = visaoSemanaMes.value;

  visaoSemanaMes.innerHTML = '';
  meses.forEach((mes) => {
    const opcao = document.createElement('option');
    opcao.value = mes;
    opcao.textContent = mes;
    visaoSemanaMes.appendChild(opcao);
  });

  if (meses.includes(atual)) visaoSemanaMes.value = atual;
  else if (meses.includes(mesAtual())) visaoSemanaMes.value = mesAtual();
}

function renderizarGraficoSemanal() {
  const mes = visaoSemanaMes.value;
  if (!mes) {
    graficoSemanal.innerHTML = '';
    graficoSemanalVazio.hidden = false;
    return;
  }
  const gastosMes = todosGastos.filter((g) => g.tipo === 'Gasto' && g['Mês'] === mes);

  const totais = {};
  gastosMes.forEach((g) => {
    const chave = formatarIso(inicioSemana(dataLocal(g.Data.slice(0, 10))));
    totais[chave] = (totais[chave] || 0) + g.Valor;
  });

  graficoSemanalVazio.hidden = gastosMes.length > 0;

  // Todas as semanas do mês (mesmo sem gasto) + semanas com gasto fora dele
  const semanas = [...new Set([...semanasDoMes(mes), ...Object.keys(totais)])].sort();

  const entradas = semanas.map((inicio) => {
    const inicioData = dataLocal(inicio);
    const fimData = new Date(inicioData);
    fimData.setDate(fimData.getDate() + 6);
    const p = (n) => String(n).padStart(2, '0');
    const rotulo = `${p(inicioData.getDate())}/${p(inicioData.getMonth() + 1)}–${p(fimData.getDate())}/${p(fimData.getMonth() + 1)}`;
    return [rotulo, totais[inicio] || 0];
  });
  renderizarBarras(graficoSemanal, entradas);
}

visaoSemanaMes.addEventListener('change', renderizarGraficoSemanal);

botaoMesAtualSemana.addEventListener('click', () => {
  visaoSemanaMes.value = mesAtual();
  renderizarGraficoSemanal();
});

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

    const celulas = [
      { texto: formatarData(gasto.Data), campo: 'Data', tipoInput: 'date', valorEdicao: gasto.Data.slice(0, 10) },
      { texto: gasto.Local, campo: 'Local', tipoInput: 'text', valorEdicao: gasto.Local },
      { texto: formatarMoeda(gasto.Valor), campo: 'Valor', tipoInput: 'number', valorEdicao: gasto.Valor, classe: 'col-valor' },
      { texto: gasto.Categoria },
      { texto: gasto['Categoria Geral'] },
      { texto: gasto.tipo, campo: 'tipo', tipoInput: 'text', valorEdicao: gasto.tipo },
      { texto: gasto['Mês'] },
    ];

    celulas.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c.texto;
      if (c.classe) td.className = c.classe;
      if (c.campo) {
        td.classList.add('editavel');
        td.tabIndex = 0;
        td.title = 'Clique para editar';
        td.addEventListener('click', () => editarCelula(td, gasto, c.campo, c.tipoInput, c.valorEdicao));
      }
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

function editarCelula(td, gasto, campo, tipoInput, valorAtual) {
  if (td.classList.contains('editando')) return;
  td.classList.add('editando');

  const valorOriginalTexto = td.textContent;
  td.textContent = '';

  const input = document.createElement('input');
  input.type = tipoInput;
  input.value = valorAtual;
  input.className = 'input-celula';
  if (tipoInput === 'number') {
    input.step = '0.01';
    input.style.textAlign = 'right';
  }
  if (campo === 'tipo') input.setAttribute('list', 'opcoes-tipo');
  input.addEventListener('click', (evento) => evento.stopPropagation());

  let finalizado = false;
  const finalizar = (salvar) => {
    if (finalizado) return;
    finalizado = true;
    if (salvar) {
      salvarEdicao(td, gasto, campo, input.value, valorOriginalTexto);
    } else {
      td.textContent = valorOriginalTexto;
      td.classList.remove('editando');
    }
  };

  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); input.blur(); }
    if (evento.key === 'Escape') { evento.preventDefault(); finalizar(false); }
  });
  input.addEventListener('blur', () => finalizar(true));

  td.appendChild(input);
  input.focus();
  if (tipoInput === 'text') input.select();
}

async function salvarEdicao(td, gasto, campo, novoValorBruto, valorOriginalTexto) {
  const cancelar = () => {
    td.textContent = valorOriginalTexto;
    td.classList.remove('editando');
  };

  let novoValor;
  if (campo === 'Valor') {
    novoValor = parseFloat(novoValorBruto);
    if (Number.isNaN(novoValor)) return cancelar();
  } else {
    novoValor = novoValorBruto.trim();
    if (!novoValor) return cancelar();
  }

  if (novoValor === gasto[campo]) return cancelar();

  const payload = {
    Data: gasto.Data.slice(0, 10),
    Local: gasto.Local,
    Valor: gasto.Valor,
    tipo: gasto.tipo,
    banco: gasto.banco,
  };
  payload[campo] = novoValor;

  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/gastos/${gasto.rowid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao salvar no servidor.');
    }

    await carregar();
  } catch (e) {
    cancelar();
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

// ---------- Parâmetros (Local → Categoria / Categoria Geral) ----------

async function carregarParametros() {
  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/param`, {
      headers: { Authorization: `Bearer ${obterToken()}` },
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao falar com o servidor.');
    }

    const { param } = await resposta.json();
    todosParam = param;
    paramCarregado = true;
    preencherSugestoesParam();
    renderizarParam();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

function preencherSugestoesParam() {
  const categorias = [...new Set(todosParam.map((p) => p.Categoria))].sort((a, b) => a.localeCompare(b));
  const categoriasGerais = [...new Set(todosParam.map((p) => p['Categoria Geral']))].sort((a, b) => a.localeCompare(b));
  preencherDatalist(opcoesParamCategoria, categorias);
  preencherDatalist(opcoesParamCategoriaGeral, categoriasGerais);
}

function renderizarParam() {
  corpoParam.innerHTML = '';
  paramVazio.hidden = todosParam.length > 0;

  todosParam.forEach((param) => {
    const tr = document.createElement('tr');

    const celulas = [
      { texto: param.Local, campo: 'Local', valorEdicao: param.Local },
      { texto: param.Categoria, campo: 'Categoria', valorEdicao: param.Categoria },
      { texto: param['Categoria Geral'], campo: 'Categoria Geral', valorEdicao: param['Categoria Geral'] },
    ];

    celulas.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c.texto;
      td.classList.add('editavel');
      td.tabIndex = 0;
      td.title = 'Clique para editar';
      td.addEventListener('click', () => editarCelulaParam(td, param, c.campo, c.valorEdicao));
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'col-acoes';
    const botaoRemover = document.createElement('button');
    botaoRemover.type = 'button';
    botaoRemover.className = 'botao-remover';
    botaoRemover.textContent = '×';
    botaoRemover.setAttribute('aria-label', `Remover parâmetro de ${param.Local}`);
    botaoRemover.addEventListener('click', () => removerParam(param.rowid, param.Local));
    tdAcoes.appendChild(botaoRemover);
    tr.appendChild(tdAcoes);

    corpoParam.appendChild(tr);
  });
}

async function adicionarParam(evento) {
  evento.preventDefault();
  erro.hidden = true;
  paramSucesso.hidden = true;

  const local = campoParamLocal.value.trim();
  const categoria = campoParamCategoria.value.trim();
  const categoriaGeral = campoParamCategoriaGeral.value.trim();
  if (!local || !categoria || !categoriaGeral) return;

  try {
    const resposta = await fetch(`${API_URL}/api/param`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify({ Local: local, Categoria: categoria, CategoriaGeral: categoriaGeral }),
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao gravar no servidor.');
    }

    paramSucesso.textContent = `Adicionado: ${local} → ${categoria} / ${categoriaGeral}`;
    paramSucesso.hidden = false;
    formParam.reset();
    campoParamLocal.focus();

    await carregarParametros();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

formParam.addEventListener('submit', adicionarParam);

async function removerParam(rowid, local) {
  if (!confirm(`Remover o parâmetro "${local}"? Essa ação não pode ser desfeita.`)) return;

  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/param/${rowid}`, {
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

    await carregarParametros();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

function editarCelulaParam(td, param, campo, valorAtual) {
  if (td.classList.contains('editando')) return;
  td.classList.add('editando');

  const valorOriginalTexto = td.textContent;
  td.textContent = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = valorAtual;
  input.className = 'input-celula';
  if (campo === 'Categoria') input.setAttribute('list', 'opcoes-param-categoria');
  if (campo === 'Categoria Geral') input.setAttribute('list', 'opcoes-param-categoria-geral');
  input.addEventListener('click', (evento) => evento.stopPropagation());

  let finalizado = false;
  const finalizar = (salvar) => {
    if (finalizado) return;
    finalizado = true;
    if (salvar) {
      salvarEdicaoParam(td, param, campo, input.value, valorOriginalTexto);
    } else {
      td.textContent = valorOriginalTexto;
      td.classList.remove('editando');
    }
  };

  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); input.blur(); }
    if (evento.key === 'Escape') { evento.preventDefault(); finalizar(false); }
  });
  input.addEventListener('blur', () => finalizar(true));

  td.appendChild(input);
  input.focus();
  input.select();
}

async function salvarEdicaoParam(td, param, campo, novoValorBruto, valorOriginalTexto) {
  const cancelar = () => {
    td.textContent = valorOriginalTexto;
    td.classList.remove('editando');
  };

  const novoValor = novoValorBruto.trim();
  if (!novoValor) return cancelar();
  if (novoValor === param[campo]) return cancelar();

  const payload = {
    Local: param.Local,
    Categoria: param.Categoria,
    CategoriaGeral: param['Categoria Geral'],
  };
  if (campo === 'Categoria Geral') payload.CategoriaGeral = novoValor;
  else payload[campo] = novoValor;

  erro.hidden = true;
  try {
    const resposta = await fetch(`${API_URL}/api/param/${param.rowid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obterToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (resposta.status === 401) {
      localStorage.removeItem('apiToken');
      throw new Error('Código de acesso inválido. Recarregue a página.');
    }
    if (!resposta.ok) {
      throw new Error('Erro ao salvar no servidor.');
    }

    await carregarParametros();
  } catch (e) {
    cancelar();
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
