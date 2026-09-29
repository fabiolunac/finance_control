/* ============================================================
   Controle de Gastos — só visualização.
   Busca a tabela final já tratada (pandas no backend) e exibe,
   com filtros por mês de pagamento, categoria e local.
   ============================================================ */

const API_URL = 'https://finance-control-99hx.onrender.com';

const statusRede = document.getElementById('status-rede');
const botaoAtualizar = document.getElementById('botao-atualizar');
const topo = document.querySelector('.topo');
const corpoTabela = document.getElementById('corpo-tabela');
const vazio = document.getElementById('vazio');
const erro = document.getElementById('erro');
const totalFiltrado = document.getElementById('total-filtrado');
const rotuloTotalFiltrado = document.getElementById('rotulo-total-filtrado');

const abaTabela = document.getElementById('aba-tabela');
const abaGraficos = document.getElementById('aba-graficos');
const abaVisaoGeral = document.getElementById('aba-visao-geral');
const abaParametros = document.getElementById('botao-parametros');
const abaConfiguracoes = document.getElementById('botao-configuracoes');
const secaoTabela = document.getElementById('secao-tabela');
const secaoGraficos = document.getElementById('secao-graficos');
const secaoVisaoGeral = document.getElementById('secao-visao-geral');
const secaoParametros = document.getElementById('secao-parametros');
const secaoConfiguracoes = document.getElementById('secao-configuracoes');

const metricaTotalGasto = document.getElementById('metrica-total-gasto');
const metricaLancamentos = document.getElementById('metrica-lancamentos');
const metricaComparacao = document.getElementById('metrica-comparacao');
const metricaFatura = document.getElementById('metrica-fatura');
const araujoContagem = document.getElementById('araujo-contagem');
const araujoDetalhe = document.getElementById('araujo-detalhe');
const corteQuando = document.getElementById('corte-quando');
const corteDetalhe = document.getElementById('corte-detalhe');
const graficoCategoriasMes = document.getElementById('grafico-categorias-mes');
const graficoSubcategoriasMes = document.getElementById('grafico-subcategorias-mes');
const graficoSubcategoriasVazio = document.getElementById('grafico-subcategorias-vazio');
const graficoCategoriasVazio = document.getElementById('grafico-categorias-vazio');
const metaSemanaTexto = document.getElementById('meta-semana-texto');
const metaSemanaBarra = document.getElementById('meta-semana-barra');
const metaSemanaLegenda = document.getElementById('meta-semana-legenda');
const visaoMes = document.getElementById('visao-mes');
const botaoMesAtualVisao = document.getElementById('botao-mes-atual-visao');
const calendario = document.getElementById('calendario');
const calendarioDetalhe = document.getElementById('calendario-detalhe');
const graficoSemanal = document.getElementById('grafico-semanal');
const graficoSemanalVazio = document.getElementById('grafico-semanal-vazio');

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
const filtroBanco = document.getElementById('filtro-banco');
const botaoMesAtual = document.getElementById('botao-mes-atual');
const botaoFiltros = document.getElementById('botao-filtros');
const painelFiltros = document.getElementById('painel-filtros');

const formGasto = document.getElementById('form-gasto');
const campoData = document.getElementById('campo-data');
const campoLocal = document.getElementById('campo-local');
const campoValor = document.getElementById('campo-valor');
const campoBanco = document.getElementById('campo-banco');
const opcoesLocal = document.getElementById('opcoes-local');
const opcoesBanco = document.getElementById('opcoes-banco');
const gavetaTitulo = document.getElementById('gaveta-titulo');
const botaoSalvarGasto = document.getElementById('botao-salvar-gasto');
const botaoExcluirGasto = document.getElementById('botao-excluir-gasto');
const botaoContinuarGasto = document.getElementById('botao-continuar-gasto');
const loteGastos = document.getElementById('lote-gastos');
const erroAdicionar = document.getElementById('erro-adicionar');
const gavetaAdicionar = document.getElementById('gaveta-adicionar');
const botaoAdicionar = document.getElementById('botao-adicionar');
const botaoFecharGaveta = document.getElementById('botao-fechar-gaveta');

const notificacao = document.getElementById('notificacao');
const notificacaoTexto = document.getElementById('notificacao-texto');
const notificacaoAcao = document.getElementById('notificacao-acao');

const formParam = document.getElementById('form-param');
const campoParamLocal = document.getElementById('campo-param-local');
const campoParamCategoria = document.getElementById('campo-param-categoria');
const campoParamCategoriaGeral = document.getElementById('campo-param-categoria-geral');
const opcoesParamCategoria = document.getElementById('opcoes-param-categoria');
const opcoesParamCategoriaGeral = document.getElementById('opcoes-param-categoria-geral');
const corpoParam = document.getElementById('corpo-param');
const paramVazio = document.getElementById('param-vazio');
const listaPendentes = document.getElementById('lista-pendentes');
const pendentesContagem = document.getElementById('pendentes-contagem');
const pendentesVazio = document.getElementById('pendentes-vazio');
const botaoMaisPendentes = document.getElementById('botao-mais-pendentes');

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

// ---------- Requisições ----------

// Chama a API com o token; lança Error com mensagem pronta pra mostrar.
// keepalive deixa a requisição terminar mesmo se o app for fechado logo depois.
async function requisitar(metodo, caminho, corpo, mensagemErro) {
  const opcoes = {
    method: metodo,
    keepalive: true,
    headers: { Authorization: `Bearer ${obterToken()}` },
  };
  if (corpo) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }

  const resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  if (resposta.status === 401) {
    localStorage.removeItem('apiToken');
    throw new Error('Código de acesso inválido. Recarregue a página.');
  }
  if (!resposta.ok) throw new Error(mensagemErro);
  return resposta;
}

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.hidden = false;
}

// ---------- Carregamento ----------

let carregouUmaVez = false;

async function carregar() {
  erro.hidden = true;
  botaoAtualizar.classList.add('girando');
  if (!carregouUmaVez) document.body.classList.add('carregando');

  // O servidor dorme quando fica sem uso e demora pra acordar; avisa se passar de 4 s
  let avisouLentidao = false;
  const timerLentidao = setTimeout(() => {
    avisouLentidao = true;
    mostrarNotificacao('Acordando o servidor, pode levar até um minuto…', null, null, 60000);
  }, 4000);

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
    // Gastos com remoção aguardando o "Desfazer" continuam fora da tela
    todosGastos = gastos.filter((g) => !gastosRemovendo.has(g.rowid));
    carregouUmaVez = true;
    renderizarTudo();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  } finally {
    clearTimeout(timerLentidao);
    if (avisouLentidao) esconderNotificacao();
    document.body.classList.remove('carregando');
    botaoAtualizar.classList.remove('girando');
  }
}

botaoAtualizar.addEventListener('click', () => {
  carregar();
  if (!secaoParametros.hidden) carregarParametros();
});

function renderizarTudo() {
  atualizarCoresCategoria();
  preencherFiltros();
  preencherFiltrosGrafico();
  preencherFiltroVisao();
  preencherSugestoes();
  aplicarFiltros();
  if (!secaoGraficos.hidden) atualizarGraficos();
  if (!secaoVisaoGeral.hidden) renderizarVisaoGeral();
  if (paramCarregado && !secaoParametros.hidden) renderizarPendentes();
}

// ---------- Filtros ----------

function valoresUnicos(campo) {
  return [...new Set(todosGastos.map((g) => g[campo]))];
}

function calcularTotalGasto(gastos) {
  const soma = (tipo) => gastos.filter((g) => g.tipo === tipo).reduce((s, g) => s + g.Valor, 0);
  return soma('Gasto') - soma('Pagamento');
}

// ---------- Cor por categoria geral ----------

// Ordem alfabética espalhada pelo círculo de matizes (ângulo áureo), pra
// categorias vizinhas não ficarem com cores parecidas. "Extra" fica cinza.
let coresCategoria = new Map();

function atualizarCoresCategoria() {
  const categorias = valoresUnicos('Categoria Geral')
    .filter((c) => c && c !== 'Extra')
    .sort((a, b) => a.localeCompare(b));
  coresCategoria = new Map(categorias.map((c, i) => [c, `hsl(${Math.round((i * 137.5 + 15) % 360)} 70% 64%)`]));
}

function corCategoria(categoriaGeral) {
  return coresCategoria.get(categoriaGeral) || 'hsl(0 0% 58%)';
}

function criarPonto(cor) {
  const ponto = document.createElement('span');
  ponto.className = 'ponto-categoria';
  ponto.style.background = cor;
  ponto.setAttribute('aria-hidden', 'true');
  return ponto;
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
    root._botao.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', () => fecharMultiSelects());
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharMultiSelects();
});

const SETA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg>';
const MINIMO_PARA_BUSCA = 8; // listas maiores ganham campo de busca

// Botão mostra o nome do filtro em cima e a escolha embaixo: "Todas",
// o valor escolhido, ou o primeiro valor com "+2" quando há mais
function atualizarTextoMultiSelect(root, campo, rotuloTodos) {
  const n = root.selecionados.size;
  const todos = rotuloTodos.split(': ')[1] || 'todos';
  root._rotulo.textContent = campo;
  root._texto.textContent = n === 0
    ? todos.charAt(0).toUpperCase() + todos.slice(1)
    : [...root.selecionados][0];
  root._contagem.hidden = n < 2;
  root._contagem.textContent = `+${n - 1}`;
  root.classList.toggle('multiselect-ativo', n > 0);
}

function filtrarItensMultiSelect(root) {
  const termo = semAcento(root._busca.value.trim().toLowerCase());
  let visiveis = 0;
  root._lista.querySelectorAll('.multiselect-item').forEach((item) => {
    const combina = !termo || item._textoBusca.includes(termo);
    item.hidden = !combina;
    if (combina) visiveis += 1;
  });
  root._semResultado.hidden = visiveis > 0;
}

function criarMultiSelect(root) {
  const rotulo = root.getAttribute('aria-label') || '';
  root.classList.add('multiselect');
  root.selecionados = new Set();
  root.innerHTML = '';

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'multiselect-botao';
  botao.setAttribute('aria-expanded', 'false');
  if (rotulo) botao.setAttribute('aria-label', rotulo);

  const textos = document.createElement('span');
  textos.className = 'multiselect-textos';
  const rotuloCampo = document.createElement('span');
  rotuloCampo.className = 'multiselect-rotulo';
  const texto = document.createElement('span');
  texto.className = 'multiselect-texto';
  textos.append(rotuloCampo, texto);

  const contagem = document.createElement('span');
  contagem.className = 'multiselect-contagem';
  contagem.hidden = true;

  const seta = document.createElement('span');
  seta.className = 'multiselect-seta';
  seta.setAttribute('aria-hidden', 'true');
  seta.innerHTML = SETA_SVG;
  botao.append(textos, contagem, seta);

  const painel = document.createElement('div');
  painel.className = 'multiselect-painel';
  painel.hidden = true;

  const busca = document.createElement('input');
  busca.type = 'search';
  busca.className = 'multiselect-busca';
  busca.placeholder = 'Buscar…';
  busca.setAttribute('aria-label', `Buscar em ${rotulo}`);
  busca.hidden = true;
  busca.addEventListener('input', () => filtrarItensMultiSelect(root));

  const lista = document.createElement('div');
  lista.className = 'multiselect-lista';

  const semResultado = document.createElement('p');
  semResultado.className = 'multiselect-sem-resultado';
  semResultado.textContent = 'Nada encontrado';
  semResultado.hidden = true;

  const rodape = document.createElement('div');
  rodape.className = 'multiselect-rodape';
  const limpar = document.createElement('button');
  limpar.type = 'button';
  limpar.className = 'multiselect-acao';
  limpar.textContent = 'Limpar';
  limpar.addEventListener('click', () => {
    root.selecionados.clear();
    lista.querySelectorAll('input[type="checkbox"]').forEach((caixa) => { caixa.checked = false; });
    atualizarTextoMultiSelect(root, root._campo, root._rotuloTodos);
    if (root._aoMudar) root._aoMudar();
  });
  const pronto = document.createElement('button');
  pronto.type = 'button';
  pronto.className = 'multiselect-acao multiselect-acao-principal';
  pronto.textContent = 'Pronto';
  pronto.addEventListener('click', () => fecharMultiSelects());
  rodape.append(limpar, pronto);

  painel.append(busca, lista, semResultado, rodape);

  botao.addEventListener('click', (evento) => {
    evento.stopPropagation();
    const vaiAbrir = painel.hidden;
    fecharMultiSelects(root);
    painel.hidden = !vaiAbrir;
    botao.classList.toggle('multiselect-aberto', vaiAbrir);
    botao.setAttribute('aria-expanded', String(vaiAbrir));
    // No celular não foca a busca, senão o teclado sobe e cobre a lista
    if (vaiAbrir && !busca.hidden && !ehCelular()) busca.focus();
  });
  painel.addEventListener('click', (evento) => evento.stopPropagation());

  root.append(botao, painel);
  root._botao = botao;
  root._rotulo = rotuloCampo;
  root._texto = texto;
  root._contagem = contagem;
  root._painel = painel;
  root._busca = busca;
  root._lista = lista;
  root._semResultado = semResultado;
  todosMultiSelects.push(root);
}

function popularMultiSelect(root, valores, rotuloTodos, campo, aoMudar) {
  root.selecionados = new Set([...root.selecionados].filter((v) => valores.includes(v)));
  root._campo = campo;
  root._rotuloTodos = rotuloTodos;
  root._aoMudar = aoMudar;
  root._lista.innerHTML = '';

  valores.forEach((valor) => {
    const item = document.createElement('label');
    item.className = 'multiselect-item';
    item._textoBusca = semAcento(String(valor ?? '').toLowerCase());

    // Checkbox nativo invisível (teclado e leitor de tela) + marca desenhada
    const caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.className = 'multiselect-caixa-nativa';
    caixa.value = valor;
    caixa.checked = root.selecionados.has(valor);
    caixa.addEventListener('change', () => {
      if (caixa.checked) root.selecionados.add(valor);
      else root.selecionados.delete(valor);
      atualizarTextoMultiSelect(root, campo, rotuloTodos);
      aoMudar();
    });

    const marca = document.createElement('span');
    marca.className = 'multiselect-marca';
    marca.setAttribute('aria-hidden', 'true');
    marca.innerHTML = CHECK_SVG;

    const span = document.createElement('span');
    span.className = 'multiselect-item-texto';
    span.textContent = valor;

    item.append(caixa, marca, span);
    root._lista.appendChild(item);
  });

  root._busca.hidden = valores.length < MINIMO_PARA_BUSCA;
  filtrarItensMultiSelect(root);
  atualizarTextoMultiSelect(root, campo, rotuloTodos);
}

function selecionarUnicoNoMultiSelect(root, valor, campo, rotuloTodos) {
  root.selecionados = new Set([valor]);
  root._painel.querySelectorAll('input[type="checkbox"]').forEach((caixa) => {
    caixa.checked = caixa.value === valor;
  });
  atualizarTextoMultiSelect(root, campo, rotuloTodos);
}

[filtroMes, filtroCategoria, filtroCategoriaGeral, filtroLocal, filtroBanco,
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
  const bancos = [...new Set(todosGastos.map(bancoDe))].sort((a, b) => a.localeCompare(b));
  popularMultiSelect(filtroBanco, bancos, 'Banco: todos', 'Banco', aplicarFiltros);
}

// Lançamentos antigos podem não ter banco; entram no filtro como "Sem banco"
function bancoDe(gasto) {
  return gasto.banco || 'Sem banco';
}

function aplicarFiltros() {
  const filtrados = gastosConsiderados().filter((g) =>
    multiSelectCombina(filtroMes, g['Mês']) &&
    multiSelectCombina(filtroCategoria, g.Categoria) &&
    multiSelectCombina(filtroCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(filtroLocal, g.Local) &&
    multiSelectCombina(filtroBanco, bancoDe(g))
  );
  renderizar(filtrados);
  totalFiltrado.textContent = formatarMoeda(calcularTotalGasto(filtrados));
  rotuloTotalFiltrado.textContent = semFatura ? 'Total gasto (filtro atual, sem fatura)' : 'Total gasto (filtro atual)';

  const ativos = [filtroCategoria, filtroCategoriaGeral, filtroLocal, filtroBanco]
    .filter((root) => root.selecionados.size > 0).length;
  botaoFiltros.textContent = ativos ? `Filtros (${ativos})` : 'Filtros';
  botaoFiltros.classList.toggle('botao-filtros-ativo', ativos > 0);
}

botaoFiltros.addEventListener('click', () => {
  const vaiAbrir = !painelFiltros.classList.contains('painel-filtros-aberto');
  painelFiltros.classList.toggle('painel-filtros-aberto', vaiAbrir);
  botaoFiltros.setAttribute('aria-expanded', String(vaiAbrir));
});

// ---------- Abas ----------

const abas = [
  [abaTabela, secaoTabela],
  [abaGraficos, secaoGraficos],
  [abaVisaoGeral, secaoVisaoGeral],
  [abaParametros, secaoParametros],
  [abaConfiguracoes, secaoConfiguracoes],
];

function selecionarAba(abaEscolhida) {
  abas.forEach(([aba, secao]) => {
    aba.classList.toggle('aba-ativa', aba === abaEscolhida);
    secao.hidden = aba !== abaEscolhida;
  });
  erro.hidden = true;
  if (abaEscolhida === abaGraficos) atualizarGraficos();
  if (abaEscolhida === abaVisaoGeral) renderizarVisaoGeral();
  if (abaEscolhida === abaParametros) carregarParametros();
}

abas.forEach(([aba]) => aba.addEventListener('click', () => selecionarAba(aba)));

// ---------- Gráficos ----------

function atualizarGraficos() {
  renderizarGrafico();
  atualizarGraficosDoMes();
}

// Gráficos que dependem do mês escolhido na aba: por dia e por categoria
function atualizarGraficosDoMes() {
  renderizarGraficoDiario();
  const gastosMes = gastosFiltradosGrafico().filter((g) => g['Mês'] === graficoDiaMes.value);
  renderizarGraficoCategoriasGerais(gastosMes);
  renderizarGraficoSubcategorias(gastosMes);
}

function renderizarGraficoCategoriasGerais(gastosMes) {
  const totais = {};
  gastosMes.filter((g) => g.tipo === 'Gasto').forEach((g) => {
    totais[g['Categoria Geral']] = (totais[g['Categoria Geral']] || 0) + g.Valor;
  });

  const categorias = Object.keys(totais).sort((a, b) => totais[b] - totais[a]);
  graficoCategoriasVazio.hidden = categorias.length > 0;
  renderizarBarras(graficoCategoriasMes, categorias.map((c) => [c, totais[c], corCategoria(c)]), { porcentagem: true });
}

function preencherFiltrosGrafico() {
  popularMultiSelect(graficoCategoria, valoresUnicos('Categoria').sort((a, b) => a.localeCompare(b)), 'Categoria: todas', 'Categoria', atualizarGraficos);
  popularMultiSelect(graficoCategoriaGeral, valoresUnicos('Categoria Geral').sort((a, b) => a.localeCompare(b)), 'Categoria geral: todas', 'Categoria geral', atualizarGraficos);
  popularMultiSelect(graficoLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)), 'Local: todos', 'Local', atualizarGraficos);
  preencherFiltroDiario();
}

// entradas: [rótulo, valor, cor opcional]
function renderizarBarras(container, entradas, { porcentagem = false } = {}) {
  const maximo = Math.max(...entradas.map(([, valorTotal]) => valorTotal), 0);
  const soma = entradas.reduce((total, [, valorTotal]) => total + valorTotal, 0);
  container.innerHTML = '';

  entradas.forEach(([rotuloTexto, valorTotal, cor]) => {
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

    if (cor) {
      rotulo.prepend(criarPonto(cor));
      barra.style.background = cor;
      barra.style.boxShadow = 'none';
    }
    if (porcentagem && soma) {
      const pct = document.createElement('span');
      pct.className = 'barra-porcentagem';
      pct.textContent = `${Math.round((valorTotal / soma) * 100)}%`;
      valor.append(' ', pct);
    }

    linha.append(rotulo, trilha, valor);
    container.appendChild(linha);
  });
}

function gastosFiltradosGrafico() {
  return gastosConsiderados().filter((g) =>
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

graficoDiaMes.addEventListener('change', atualizarGraficosDoMes);

botaoMesAtualDia.addEventListener('click', () => {
  graficoDiaMes.value = mesAtual();
  atualizarGraficosDoMes();
});

// ---------- Visão geral ----------

function mesAtual() {
  return formatarIso(new Date()).slice(0, 7); // YYYY-MM, no fuso local
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function mesAnterior(mes) {
  const [ano, m] = mes.split('-').map(Number);
  return formatarIso(new Date(ano, m - 2, 1)).slice(0, 7);
}

// Compara com o mês anterior; no mês corrente, só com o mesmo trecho (dia 1 até hoje)
function renderizarComparacao(mes, totalMes) {
  const anterior = mesAnterior(mes);
  const nomeAnterior = MESES[Number(anterior.slice(5)) - 1];
  let gastosAnteriores = gastosConsiderados().filter((g) => g['Mês'] === anterior);
  let rotulo = `vs ${nomeAnterior}`;

  if (mes === mesAtual()) {
    const dia = new Date().getDate();
    gastosAnteriores = gastosAnteriores.filter((g) => Number(g.Data.slice(8, 10)) <= dia);
    rotulo = `vs 1–${dia} de ${nomeAnterior}`;
  }

  const totalAnterior = calcularTotalGasto(gastosAnteriores);
  if (totalAnterior <= 0) {
    metricaComparacao.hidden = true;
    return;
  }

  const variacao = (totalMes - totalAnterior) / totalAnterior;
  const subiu = variacao > 0;
  metricaComparacao.textContent = `${subiu ? '▲' : '▼'} ${Math.abs(variacao * 100).toFixed(0)}% ${rotulo}`;
  // Gastar mais é o lado ruim: vermelho quando sobe
  metricaComparacao.className = 'metrica-delta ' + (subiu ? 'metrica-delta-negativa' : 'metrica-delta-positiva');
  metricaComparacao.hidden = false;
}

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

// Conta do valor anterior até o novo em ~0,6 s
function animarValor(elemento, valor) {
  const inicio = elemento._valor ?? 0;
  elemento._valor = valor;
  cancelAnimationFrame(elemento._quadro);

  if (inicio === valor || reduzirMovimento.matches) {
    elemento.textContent = formatarMoeda(valor);
    return;
  }

  const t0 = performance.now();
  const passo = (agora) => {
    const progresso = Math.min((agora - t0) / 600, 1);
    const suave = 1 - (1 - progresso) ** 3;
    elemento.textContent = formatarMoeda(inicio + (valor - inicio) * suave);
    if (progresso < 1) elemento._quadro = requestAnimationFrame(passo);
  };
  elemento._quadro = requestAnimationFrame(passo);
}

// Mês escolhido no filtro da aba (cai no mês atual enquanto não há opções)
function mesSelecionado() {
  return visaoMes.value || mesAtual();
}

function renderizarVisaoGeral() {
  const gastosMes = gastosConsiderados().filter((g) => g['Mês'] === mesSelecionado());

  const totalMes = calcularTotalGasto(gastosMes);
  animarValor(metricaTotalGasto, totalMes);
  renderizarComparacao(mesSelecionado(), totalMes);

  // Com a fatura fora, diz quanto ficou de fora (e confirma o que foi reconhecido)
  const faturasMes = todosGastos.filter((g) => g['Mês'] === mesSelecionado() && ehFatura(g));
  metricaFatura.hidden = !semFatura || faturasMes.length === 0;
  metricaFatura.textContent = `Sem fatura · ${formatarMoeda(calcularTotalGasto(faturasMes))} fora do total`;
  const n = gastosMes.length;
  metricaLancamentos.textContent = `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`;

  renderizarMetaSemanal();
  renderizarAraujo();
  renderizarUltimoCorte();
  renderizarCalendario();
  renderizarGraficoSemanal();
}

visaoMes.addEventListener('change', renderizarVisaoGeral);

botaoMesAtualVisao.addEventListener('click', () => {
  visaoMes.value = mesAtual();
  renderizarVisaoGeral();
});

// ---------- Gastos por categoria (nível detalhado) ----------

// Acima disso as menores viram uma barra só de "Outras", pra lista não ficar enorme
const LIMITE_CATEGORIAS = 10;

function renderizarGraficoSubcategorias(gastosMes) {
  const totais = {};
  const geraisPorCategoria = {}; // pra pintar a barra com a cor da categoria geral
  gastosMes.filter((g) => g.tipo === 'Gasto').forEach((g) => {
    totais[g.Categoria] = (totais[g.Categoria] || 0) + g.Valor;
    const gerais = (geraisPorCategoria[g.Categoria] = geraisPorCategoria[g.Categoria] || {});
    gerais[g['Categoria Geral']] = (gerais[g['Categoria Geral']] || 0) + 1;
  });

  const geralMaisComum = (categoria) => {
    const gerais = geraisPorCategoria[categoria];
    return Object.keys(gerais).sort((a, b) => gerais[b] - gerais[a])[0];
  };

  const categorias = Object.keys(totais).sort((a, b) => totais[b] - totais[a]);
  graficoSubcategoriasVazio.hidden = categorias.length > 0;

  const entradas = categorias.slice(0, LIMITE_CATEGORIAS)
    .map((c) => [c, totais[c], corCategoria(geralMaisComum(c))]);
  const resto = categorias.slice(LIMITE_CATEGORIAS);
  if (resto.length) {
    const somaResto = resto.reduce((soma, c) => soma + totais[c], 0);
    entradas.push([`Outras (${resto.length})`, somaResto, 'hsl(0 0% 58%)']);
  }
  renderizarBarras(graficoSubcategoriasMes, entradas, { porcentagem: true });
}

// ---------- Cards específicos: Araújo e corte de cabelo ----------

function contem(texto, trecho) {
  return Boolean(texto) && semAcento(texto).toLowerCase().includes(trecho);
}

function textoDiasAtras(dataIso) {
  const hoje = dataLocal(formatarIso(new Date()));
  const dias = Math.round((hoje - dataLocal(dataIso.slice(0, 10))) / 86400000);
  return dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`;
}

function maisRecente(gastos) {
  return gastos.reduce((a, b) => (b.Data > a.Data ? b : a));
}

// Compras na Araújo no mês escolhido (cada uma ≈ um Monster)
function renderizarAraujo() {
  const compras = todosGastos.filter((g) =>
    g.tipo === 'Gasto' && g['Mês'] === mesSelecionado() && contem(g.Local, 'araujo'));
  araujoContagem.textContent = String(compras.length);
  if (!compras.length) {
    araujoDetalhe.textContent = 'Nenhuma compra neste mês';
    return;
  }
  const total = compras.reduce((soma, g) => soma + g.Valor, 0);
  araujoDetalhe.textContent = `${formatarMoeda(total)} · última em ${formatarData(maisRecente(compras).Data).slice(0, 5)}`;
}

// Último lançamento com categoria de corte de cabelo, em todo o histórico
function renderizarUltimoCorte() {
  const cortes = todosGastos.filter((g) =>
    g.tipo === 'Gasto' && contem(g.Categoria, 'corte') && contem(g.Categoria, 'cabelo'));
  if (!cortes.length) {
    corteQuando.textContent = '—';
    corteDetalhe.textContent = 'Nenhum corte registrado';
    return;
  }
  const ultimo = maisRecente(cortes);
  corteQuando.textContent = textoDiasAtras(ultimo.Data);
  corteDetalhe.textContent = `${formatarData(ultimo.Data)} · ${ultimo.Local} · ${formatarMoeda(ultimo.Valor)}`;
}

// ---------- Teto de gasto da semana atual ----------

const TETO_SEMANAL = 250;

function renderizarMetaSemanal() {
  const inicio = inicioSemana(new Date());
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const inicioIso = formatarIso(inicio);
  const fimIso = formatarIso(fim);

  const gastoSemana = gastosConsiderados()
    .filter((g) => g.tipo === 'Gasto')
    .filter((g) => {
      const data = g.Data.slice(0, 10);
      return data >= inicioIso && data <= fimIso;
    })
    .reduce((soma, g) => soma + g.Valor, 0);

  const fracao = gastoSemana / TETO_SEMANAL;
  metaSemanaBarra.style.width = `${Math.min(fracao, 1) * 100}%`;
  metaSemanaBarra.className = 'progresso-barra ' +
    (fracao >= 1 ? 'progresso-critico' : fracao >= 0.7 ? 'progresso-alerta' : 'progresso-ok');

  const p = (n) => String(n).padStart(2, '0');
  metaSemanaTexto.textContent =
    `Semana atual (${p(inicio.getDate())}/${p(inicio.getMonth() + 1)} – ${p(fim.getDate())}/${p(fim.getMonth() + 1)})`;

  const restante = TETO_SEMANAL - gastoSemana;
  const diasRestantes = 7 - (new Date().getDay() + 6) % 7; // contando hoje
  metaSemanaLegenda.textContent = restante >= 0
    ? `${formatarMoeda(gastoSemana)} de ${formatarMoeda(TETO_SEMANAL)} — faltam ${formatarMoeda(restante)} (${formatarMoeda(restante / diasRestantes)}/dia até domingo)`
    : `${formatarMoeda(gastoSemana)} de ${formatarMoeda(TETO_SEMANAL)} — ${formatarMoeda(-restante)} acima do teto`;
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

function preencherFiltroVisao() {
  const meses = valoresUnicos('Mês').sort().reverse();
  const atual = visaoMes.value;

  visaoMes.innerHTML = '';
  meses.forEach((mes) => {
    const opcao = document.createElement('option');
    opcao.value = mes;
    opcao.textContent = mes;
    visaoMes.appendChild(opcao);
  });

  if (meses.includes(atual)) visaoMes.value = atual;
  else if (meses.includes(mesAtual())) visaoMes.value = mesAtual();
}

function renderizarGraficoSemanal() {
  const mes = mesSelecionado();
  const gastosMes = gastosConsiderados().filter((g) => g.tipo === 'Gasto' && g['Mês'] === mes);

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

// ---------- Calendário do mês ----------

const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

let diaCalendario = null; // dia tocado no calendário (YYYY-MM-DD)

function selecionarDiaCalendario(iso) {
  diaCalendario = diaCalendario === iso ? null : iso;
  renderizarCalendario();
}

function renderizarCalendario() {
  const mes = mesSelecionado();
  const [ano, m] = mes.split('-').map(Number);
  if (diaCalendario && diaCalendario.slice(0, 7) !== mes) diaCalendario = null;

  // Soma por dia, pela data do gasto (o dia precisa existir no mês mostrado)
  const totaisPorDia = {};
  gastosConsiderados().forEach((g) => {
    if (g.tipo !== 'Gasto') return;
    const data = g.Data.slice(0, 10);
    if (data.slice(0, 7) !== mes) return;
    totaisPorDia[data] = (totaisPorDia[data] || 0) + g.Valor;
  });

  const maximo = Math.max(0, ...Object.values(totaisPorDia));
  calendario.innerHTML = '';

  DIAS_SEMANA.forEach((nome) => {
    const cabecalho = document.createElement('span');
    cabecalho.className = 'calendario-cabecalho';
    cabecalho.textContent = nome;
    calendario.appendChild(cabecalho);
  });

  // Casas vazias até a primeira segunda-feira do mês
  const vazias = (new Date(ano, m - 1, 1).getDay() + 6) % 7;
  for (let i = 0; i < vazias; i += 1) {
    calendario.appendChild(document.createElement('span'));
  }

  const diasNoMes = new Date(ano, m, 0).getDate();
  const hoje = formatarIso(new Date());

  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    const iso = formatarIso(new Date(ano, m - 1, dia));
    const total = totaisPorDia[iso];
    const celula = document.createElement(total ? 'button' : 'span');
    celula.className = 'calendario-dia';
    celula.textContent = String(dia);

    if (iso === hoje) celula.classList.add('calendario-hoje');

    // Dia com gasto: cor mais forte quanto maior o total, e tocável
    if (total) {
      celula.type = 'button';
      celula.classList.add('calendario-com-gasto');
      celula.style.setProperty('--intensidade', (total / maximo).toFixed(2));
      celula.title = `${formatarData(iso)}: ${formatarMoeda(total)}`;
      celula.setAttribute('aria-label', celula.title);
      celula.setAttribute('aria-pressed', String(iso === diaCalendario));
      if (iso === diaCalendario) celula.classList.add('calendario-selecionado');
      celula.addEventListener('click', () => selecionarDiaCalendario(iso));
    }

    calendario.appendChild(celula);
  }

  renderizarDetalheCalendario();
}

// Lista abaixo do calendário com os gastos do dia tocado
function renderizarDetalheCalendario() {
  const gastosDia = diaCalendario
    ? gastosConsiderados().filter((g) => g.tipo === 'Gasto' && g.Data.slice(0, 10) === diaCalendario)
    : [];
  calendarioDetalhe.innerHTML = '';
  calendarioDetalhe.hidden = gastosDia.length === 0;
  if (!gastosDia.length) return;

  const cabecalho = document.createElement('div');
  cabecalho.className = 'mini-lista-cabecalho';
  const nome = document.createElement('span');
  nome.textContent = rotuloDia(diaCalendario);
  const total = document.createElement('span');
  total.className = 'linha-dia-total';
  total.textContent = formatarMoeda(calcularTotalGasto(gastosDia));
  cabecalho.append(nome, total);
  calendarioDetalhe.appendChild(cabecalho);

  gastosDia.forEach((gasto) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'mini-lista-item';
    const local = document.createElement('span');
    local.className = 'mini-lista-local';
    local.append(criarPonto(corCategoria(gasto['Categoria Geral'])), gasto.Local);
    const valor = document.createElement('span');
    valor.className = 'mini-lista-valor';
    valor.textContent = formatarMoeda(gasto.Valor);
    item.append(local, valor);
    item.addEventListener('click', () => abrirGaveta(gasto));
    calendarioDetalhe.appendChild(item);
  });
}

// ---------- Gaveta de gasto (novo e edição) ----------

function preencherDatalist(datalist, valores) {
  datalist.innerHTML = '';
  valores.forEach((valor) => {
    const opcao = document.createElement('option');
    opcao.value = valor;
    datalist.appendChild(opcao);
  });
}

function preencherSugestoes() {
  preencherDatalist(opcoesLocal, valoresUnicos('Local').sort((a, b) => a.localeCompare(b)));
  preencherDatalist(opcoesBanco, valoresUnicos('banco').filter(Boolean).sort((a, b) => a.localeCompare(b)));
}

function lerUltimoBanco() {
  try { return localStorage.getItem('ultimoBanco') || ''; } catch (e) { return ''; }
}

function salvarUltimoBanco(banco) {
  try { localStorage.setItem('ultimoBanco', banco); } catch (e) {}
}

// Aceita "12,50", "12.50" e "1.234,56"
function lerValor(texto) {
  let limpo = texto.trim().replace(/\s/g, '');
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  const valor = parseFloat(limpo);
  return valor >= 0 ? valor : NaN;
}

function ehCelular() {
  return window.matchMedia('(max-width: 640px)').matches;
}

let gastoEditando = null; // gasto aberto na gaveta; null quando é um gasto novo

// "Adicionar e continuar": gastos lançados em sequência nesta abertura da
// gaveta, e a data/banco/tipo que seguem de um lançamento pro outro
let lote = [];
let camposLote = null;
let editandoDoLote = false;

// doLote: veio da sequência (mantém a lista e os campos que seguem)
function abrirGaveta(gasto = null, doLote = false) {
  gastoEditando = gasto;
  editandoDoLote = Boolean(gasto) && doLote;
  if (!doLote) {
    lote = [];
    camposLote = null;
  }

  erroAdicionar.hidden = true;
  gavetaTitulo.textContent = gasto ? 'Editar gasto' : 'Novo gasto';
  botaoSalvarGasto.textContent = gasto ? 'Salvar' : 'Adicionar';
  botaoExcluirGasto.hidden = !gasto;
  botaoContinuarGasto.hidden = Boolean(gasto);

  if (gasto) {
    campoValor.value = String(gasto.Valor).replace('.', ',');
    campoLocal.value = gasto.Local;
    campoData.value = gasto.Data.slice(0, 10);
    campoBanco.value = gasto.banco || '';
    formGasto.elements.tipo.value = gasto.tipo;
  } else {
    campoValor.value = '';
    campoLocal.value = '';
    campoData.value = camposLote ? camposLote.Data : formatarIso(new Date());
    campoBanco.value = camposLote ? camposLote.banco : lerUltimoBanco();
    formGasto.elements.tipo.value = camposLote ? camposLote.tipo : 'Gasto';
  }

  renderizarLote();
  if (!gavetaAdicionar.open) gavetaAdicionar.showModal();
  if (!gasto) campoValor.focus();
}

// Acha o gasto recém-criado nos dados recarregados: pelo rowid que a API
// devolve ou, se ela não devolver, pelo lançamento igual mais recente
function acharGastoCriado(gasto, rowid) {
  if (rowid != null) return todosGastos.find((g) => g.rowid === rowid) || null;
  const jaNoLote = new Set(lote.map((g) => g.rowid));
  const iguais = todosGastos.filter((g) =>
    g.Data.slice(0, 10) === gasto.Data && g.Local === gasto.Local && g.Valor === gasto.Valor &&
    g.tipo === gasto.tipo && g.banco === gasto.banco && !jaNoLote.has(g.rowid));
  return iguais.sort((a, b) => b.rowid - a.rowid)[0] || null;
}

function renderizarLote() {
  loteGastos.innerHTML = '';
  loteGastos.hidden = lote.length === 0;
  if (!lote.length) return;

  const cabecalho = document.createElement('div');
  cabecalho.className = 'mini-lista-cabecalho';
  const contagem = document.createElement('span');
  contagem.textContent = `${lote.length} ${lote.length === 1 ? 'lançamento' : 'lançamentos'}`;
  const total = document.createElement('span');
  total.className = 'linha-dia-total';
  total.textContent = formatarMoeda(calcularTotalGasto(lote));
  cabecalho.append(contagem, total);
  loteGastos.appendChild(cabecalho);

  lote.forEach((gasto) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'mini-lista-item';
    if (gastoEditando && gastoEditando.rowid === gasto.rowid) item.classList.add('mini-lista-item-ativo');
    // Sem rowid (recarga falhou) não dá pra abrir pra edição
    item.disabled = gasto.rowid == null;

    const local = document.createElement('span');
    local.className = 'mini-lista-local';
    local.append(criarPonto(corCategoria(gasto['Categoria Geral'])), gasto.Local);
    const valor = document.createElement('span');
    valor.className = 'mini-lista-valor';
    valor.textContent = formatarMoeda(gasto.Valor);
    item.append(local, valor);
    item.addEventListener('click', () => abrirGaveta(gasto, true));
    loteGastos.appendChild(item);
  });
}

async function salvarGasto(evento) {
  evento.preventDefault();
  erroAdicionar.hidden = true;
  const continuar = evento.submitter === botaoContinuarGasto;

  const gasto = {
    Data: campoData.value,
    Local: campoLocal.value.trim(),
    Valor: lerValor(campoValor.value),
    tipo: formGasto.elements.tipo.value,
    banco: campoBanco.value.trim(),
  };

  if (Number.isNaN(gasto.Valor)) {
    erroAdicionar.textContent = 'Valor inválido. Use algo como 12,50.';
    erroAdicionar.hidden = false;
    return;
  }
  if (!gasto.Data || !gasto.Local || !gasto.tipo || !gasto.banco) return;

  const editando = gastoEditando;
  const doLote = editandoDoLote;
  botaoSalvarGasto.disabled = true;
  botaoContinuarGasto.disabled = true;
  try {
    let rowid = null;
    if (editando) {
      await requisitar('PUT', `/api/gastos/${editando.rowid}`, gasto, 'Erro ao salvar no servidor.');
    } else {
      const resposta = await requisitar('POST', '/api/gastos', gasto, 'Erro ao gravar no servidor.');
      rowid = (await resposta.json()).rowid ?? null;
    }
    salvarUltimoBanco(gasto.banco);

    if (continuar || doLote) {
      // Fica na gaveta: item provisório na lista já, dados completos após recarregar
      const provisorio = { ...(editando || {}), ...gasto, rowid: editando ? editando.rowid : rowid };
      if (editando) lote = lote.map((g) => (g.rowid === editando.rowid ? provisorio : g));
      else {
        camposLote = { Data: gasto.Data, banco: gasto.banco, tipo: gasto.tipo };
        lote.push(provisorio);
      }
      if (doLote) mostrarNotificacao('Alterações salvas');
      abrirGaveta(null, true);

      await carregar();
      lote = lote.map((g) => (g === provisorio
        ? acharGastoCriado(gasto, provisorio.rowid) || provisorio
        : todosGastos.find((t) => t.rowid === g.rowid) || g));
      renderizarLote();
      return;
    }

    gavetaAdicionar.close();
    mostrarNotificacao(editando
      ? 'Alterações salvas'
      : `Adicionado: ${gasto.Local} · ${formatarMoeda(gasto.Valor)}`);
    await carregar();
  } catch (e) {
    erroAdicionar.textContent = e.message;
    erroAdicionar.hidden = false;
  } finally {
    botaoSalvarGasto.disabled = false;
    botaoContinuarGasto.disabled = false;
  }
}

formGasto.addEventListener('submit', salvarGasto);

botaoExcluirGasto.addEventListener('click', () => {
  const gasto = gastoEditando;
  if (editandoDoLote) {
    // Sai da lista e volta pro próximo lançamento; o aviso de desfazer aparece na gaveta
    lote = lote.filter((g) => g.rowid !== gasto.rowid);
    abrirGaveta(null, true);
  } else {
    gavetaAdicionar.close();
  }
  removerGasto(gasto);
});

botaoAdicionar.addEventListener('click', () => abrirGaveta());
botaoFecharGaveta.addEventListener('click', () => gavetaAdicionar.close());

// Clique no fundo escurecido (fora do corpo da gaveta) fecha
gavetaAdicionar.addEventListener('click', (evento) => {
  if (evento.target === gavetaAdicionar) gavetaAdicionar.close();
});

// ---------- Notificação e "Desfazer" ----------

let notificacaoTimer = null;

// A gaveta aberta fica acima de tudo; pra aparecer, o aviso entra nela
function moverNotificacao() {
  const destino = gavetaAdicionar.open ? gavetaAdicionar : document.body;
  if (notificacao.parentElement !== destino) destino.appendChild(notificacao);
  notificacao.classList.toggle('notificacao-na-gaveta', gavetaAdicionar.open);
}

gavetaAdicionar.addEventListener('close', moverNotificacao);

function esconderNotificacao() {
  clearTimeout(notificacaoTimer);
  notificacao.hidden = true;
}

function mostrarNotificacao(texto, rotuloAcao = null, aoAgir = null, duracao = 3000) {
  clearTimeout(notificacaoTimer);
  notificacaoTexto.textContent = texto;
  notificacaoAcao.hidden = !rotuloAcao;
  notificacaoAcao.textContent = rotuloAcao || '';
  notificacaoAcao.onclick = aoAgir ? () => { esconderNotificacao(); aoAgir(); } : null;
  moverNotificacao();
  notificacao.hidden = false;
  notificacaoTimer = setTimeout(esconderNotificacao, duracao);
}

// A remoção só vai pro servidor depois de alguns segundos, pra dar tempo de
// desfazer. Uma nova remoção, ou o app indo pro fundo, envia a anterior na hora.
const ESPERA_DESFAZER = 5000;
const gastosRemovendo = new Set();
const paramRemovendo = new Set();
let remocaoPendente = null;

function enviarRemocaoPendente() {
  if (!remocaoPendente) return;
  const { enviar, timer } = remocaoPendente;
  clearTimeout(timer);
  remocaoPendente = null;
  enviar();
}

function removerComDesfazer(mensagem, { tirar, devolver, enviar }) {
  enviarRemocaoPendente();
  tirar();

  const pendente = { enviar };
  pendente.timer = setTimeout(enviarRemocaoPendente, ESPERA_DESFAZER);
  remocaoPendente = pendente;

  mostrarNotificacao(mensagem, 'Desfazer', () => {
    clearTimeout(pendente.timer);
    if (remocaoPendente === pendente) remocaoPendente = null;
    devolver();
  }, ESPERA_DESFAZER);
}

window.addEventListener('pagehide', enviarRemocaoPendente);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') enviarRemocaoPendente();
});

// ---------- Renderização ----------

// Rótulo do cabeçalho de dia na lista do celular: "Hoje", "Ontem" ou "seg, 27/09"
function rotuloDia(dataIso) {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (dataIso === formatarIso(hoje)) return 'Hoje';
  if (dataIso === formatarIso(ontem)) return 'Ontem';
  const data = dataLocal(dataIso);
  return `${DIAS_SEMANA[(data.getDay() + 6) % 7]}, ${formatarData(dataIso).slice(0, 5)}`;
}

function renderizar(gastos) {
  corpoTabela.innerHTML = '';
  vazio.hidden = gastos.length > 0;

  // Total por dia, para os cabeçalhos de dia (só aparecem no celular)
  const porDia = {};
  gastos.forEach((g) => {
    const dia = g.Data.slice(0, 10);
    (porDia[dia] = porDia[dia] || []).push(g);
  });
  let diaAnterior = null;

  gastos.forEach((gasto) => {
    const dia = gasto.Data.slice(0, 10);
    if (dia !== diaAnterior) {
      diaAnterior = dia;
      const trDia = document.createElement('tr');
      trDia.className = 'linha-dia';
      const tdDia = document.createElement('td');
      tdDia.colSpan = 8;
      const nome = document.createElement('span');
      nome.textContent = rotuloDia(dia);
      const total = document.createElement('span');
      total.className = 'linha-dia-total';
      total.textContent = formatarMoeda(calcularTotalGasto(porDia[dia]));
      tdDia.append(nome, total);
      trDia.appendChild(tdDia);
      corpoTabela.appendChild(trDia);
    }

    const tr = document.createElement('tr');
    if (gasto.tipo === 'Pagamento') tr.classList.add('linha-pagamento');

    const celulas = [
      { texto: formatarData(gasto.Data), campo: 'Data', tipoInput: 'date', valorEdicao: gasto.Data.slice(0, 10) },
      { texto: gasto.Local, campo: 'Local', tipoInput: 'text', valorEdicao: gasto.Local },
      { texto: formatarMoeda(gasto.Valor), campo: 'Valor', tipoInput: 'number', valorEdicao: gasto.Valor, classe: 'col-valor' },
      { texto: gasto.Categoria, ponto: true },
      { texto: gasto['Categoria Geral'], ponto: true },
      { texto: gasto.tipo, campo: 'tipo', tipoInput: 'text', valorEdicao: gasto.tipo },
      { texto: gasto['Mês'] },
    ];

    celulas.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c.texto;
      if (c.ponto) td.prepend(criarPonto(corCategoria(gasto['Categoria Geral'])));
      if (c.classe) td.className = c.classe;
      if (c.campo) {
        td.classList.add('editavel');
        td.tabIndex = 0;
        td.title = 'Clique para editar';
        td.addEventListener('click', () => {
          if (!ehCelular()) editarCelula(td, gasto, c.campo, c.tipoInput, c.valorEdicao);
        });
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
    botaoRemover.addEventListener('click', () => removerGasto(gasto));
    tdAcoes.appendChild(botaoRemover);
    tr.appendChild(tdAcoes);

    // No celular a linha inteira abre a gaveta de edição
    tr.addEventListener('click', () => {
      if (ehCelular()) abrirGaveta(gasto);
    });

    corpoTabela.appendChild(tr);
  });
}

function ordenarGastos(gastos) {
  return gastos.sort((a, b) => b.Data.localeCompare(a.Data) || b.rowid - a.rowid);
}

function removerGasto(gasto) {
  erro.hidden = true;
  removerComDesfazer(`Gasto removido: ${gasto.Local}`, {
    tirar: () => {
      gastosRemovendo.add(gasto.rowid);
      todosGastos = todosGastos.filter((g) => g.rowid !== gasto.rowid);
      renderizarTudo();
    },
    devolver: () => {
      gastosRemovendo.delete(gasto.rowid);
      todosGastos = ordenarGastos([...todosGastos, gasto]);
      renderizarTudo();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/gastos/${gasto.rowid}`, null, 'Erro ao remover no servidor.');
      } catch (e) {
        mostrarErro(e.message);
        gastosRemovendo.delete(gasto.rowid);
        carregar();
        return;
      }
      gastosRemovendo.delete(gasto.rowid);
    },
  });
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
    todosParam = param.filter((p) => !paramRemovendo.has(p.rowid));
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
    botaoRemover.addEventListener('click', () => removerParam(param));
    tdAcoes.appendChild(botaoRemover);
    tr.appendChild(tdAcoes);

    corpoParam.appendChild(tr);
  });

  renderizarPendentes();
}

// ---------- Locais sem categoria ----------

// Locais dos gastos que não têm parâmetro: mesma comparação exata do servidor,
// então um local categorizado de propósito como "Extra" não entra aqui
const LIMITE_PENDENTES = 10;
let mostrarTodosPendentes = false;
const rascunhosPendentes = new Map(); // texto digitado por local, sobrevive às recargas

function locaisPendentes() {
  const cadastrados = new Set(todosParam.map((p) => p.Local));
  const grupos = new Map();
  todosGastos.forEach((g) => {
    if (cadastrados.has(g.Local)) return;
    const grupo = grupos.get(g.Local) || { local: g.Local, quantidade: 0, total: 0 };
    grupo.quantidade += 1;
    grupo.total += g.Valor;
    grupos.set(g.Local, grupo);
  });
  return [...grupos.values()].sort((a, b) => b.quantidade - a.quantidade || b.total - a.total);
}

// Categoria Geral mais usada com essa Categoria nos parâmetros
function geralSugerida(categoria) {
  const contagem = {};
  todosParam.forEach((p) => {
    if (p.Categoria === categoria) contagem[p['Categoria Geral']] = (contagem[p['Categoria Geral']] || 0) + 1;
  });
  return Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0] || '';
}

function textoLancamentos(n) {
  return `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`;
}

function renderizarPendentes() {
  // Sem os gastos carregados a lista sairia vazia e diria que está tudo certo
  if (!carregouUmaVez) return;

  const pendentes = locaisPendentes();
  pendentesContagem.textContent = pendentes.length ? `(${pendentes.length})` : '';
  pendentesVazio.hidden = pendentes.length > 0;

  const visiveis = mostrarTodosPendentes ? pendentes : pendentes.slice(0, LIMITE_PENDENTES);
  listaPendentes.innerHTML = '';
  visiveis.forEach((grupo) => listaPendentes.appendChild(criarLinhaPendente(grupo)));

  botaoMaisPendentes.hidden = pendentes.length <= LIMITE_PENDENTES;
  botaoMaisPendentes.textContent = mostrarTodosPendentes ? 'Mostrar menos' : `Mostrar todos (${pendentes.length})`;
}

botaoMaisPendentes.addEventListener('click', () => {
  mostrarTodosPendentes = !mostrarTodosPendentes;
  renderizarPendentes();
});

function criarCampoPendente(lista, placeholder, local, valor) {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.setAttribute('list', lista);
  campo.placeholder = placeholder;
  campo.autocomplete = 'off';
  campo.maxLength = 120;
  campo.required = true;
  campo.value = valor;
  campo.setAttribute('aria-label', `${placeholder} de ${local}`);
  return campo;
}

function criarLinhaPendente({ local, quantidade, total }) {
  const form = document.createElement('form');
  form.className = 'pendente';

  const info = document.createElement('div');
  info.className = 'pendente-info';
  const nome = document.createElement('span');
  nome.className = 'pendente-local';
  nome.textContent = local;
  const meta = document.createElement('span');
  meta.className = 'pendente-meta';
  meta.textContent = `${textoLancamentos(quantidade)} · ${formatarMoeda(total)}`;
  info.append(nome, meta);

  const rascunho = rascunhosPendentes.get(local) || { categoria: '', geral: '' };
  const campoCategoria = criarCampoPendente('opcoes-param-categoria', 'Categoria', local, rascunho.categoria);
  const campoGeral = criarCampoPendente('opcoes-param-categoria-geral', 'Categoria Geral', local, rascunho.geral);

  const guardar = () => rascunhosPendentes.set(local, { categoria: campoCategoria.value, geral: campoGeral.value });
  campoCategoria.addEventListener('input', guardar);
  campoGeral.addEventListener('input', guardar);
  // Escolhida uma Categoria conhecida, já sugere a Categoria Geral que costuma acompanhá-la
  campoCategoria.addEventListener('change', () => {
    if (!campoGeral.value.trim()) {
      campoGeral.value = geralSugerida(campoCategoria.value.trim());
      guardar();
    }
  });

  const botao = document.createElement('button');
  botao.type = 'submit';
  botao.className = 'botao-primario';
  botao.textContent = 'Salvar';

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    salvarPendente(local, quantidade, campoCategoria.value.trim(), campoGeral.value.trim(), botao);
  });

  const campos = document.createElement('div');
  campos.className = 'pendente-campos';
  campos.append(campoCategoria, campoGeral, botao);
  form.append(info, campos);
  return form;
}

async function salvarPendente(local, quantidade, categoria, categoriaGeral, botao) {
  if (!categoria || !categoriaGeral) return;
  erro.hidden = true;
  botao.disabled = true;

  try {
    await requisitar('POST', '/api/param',
      { Local: local, Categoria: categoria, CategoriaGeral: categoriaGeral }, 'Erro ao gravar no servidor.');
  } catch (e) {
    mostrarErro(e.message);
    botao.disabled = false;
    return;
  }

  // Sai da lista na hora; parâmetros e gastos atualizados chegam em seguida
  rascunhosPendentes.delete(local);
  todosParam = [...todosParam, { Local: local, Categoria: categoria, 'Categoria Geral': categoriaGeral }];
  renderizarPendentes();
  mostrarNotificacao(`${local} → ${categoria} · ${textoLancamentos(quantidade)} ${quantidade === 1 ? 'atualizado' : 'atualizados'}`);

  await Promise.all([carregarParametros(), carregar()]);
}

async function adicionarParam(evento) {
  evento.preventDefault();
  erro.hidden = true;

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

    mostrarNotificacao(`Adicionado: ${local} → ${categoria}`);
    formParam.reset();
    campoParamLocal.focus();

    await Promise.all([carregarParametros(), carregar()]);
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

formParam.addEventListener('submit', adicionarParam);

function removerParam(param) {
  erro.hidden = true;
  removerComDesfazer(`Parâmetro removido: ${param.Local}`, {
    tirar: () => {
      paramRemovendo.add(param.rowid);
      todosParam = todosParam.filter((p) => p.rowid !== param.rowid);
      renderizarParam();
    },
    devolver: () => {
      paramRemovendo.delete(param.rowid);
      todosParam = [...todosParam, param].sort((a, b) => a.Local.localeCompare(b.Local));
      renderizarParam();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/param/${param.rowid}`, null, 'Erro ao remover no servidor.');
      } catch (e) {
        mostrarErro(e.message);
        paramRemovendo.delete(param.rowid);
        carregarParametros();
        return;
      }
      paramRemovendo.delete(param.rowid);
      carregar();
    },
  });
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

    await Promise.all([carregarParametros(), carregar()]);
  } catch (e) {
    cancelar();
    erro.textContent = e.message;
    erro.hidden = false;
  }
}

// ---------- Com ou sem fatura ----------

// A fatura do cartão entra como um lançamento só (ex.: "Fatura Nubank"); é
// reconhecida pela palavra "fatura" no local ou na categoria, sem ligar pra
// maiúsculas nem acento. "Sem fatura" tira esses lançamentos de todas as contas.
function semAcento(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function ehFatura(gasto) {
  return [gasto.Local, gasto.Categoria, gasto['Categoria Geral']]
    .some((texto) => texto && semAcento(texto).toLowerCase().includes('fatura'));
}

let semFatura = (() => {
  try { return localStorage.getItem('semFatura') === '1'; } catch (e) { return false; }
})();

function gastosConsiderados() {
  return semFatura ? todosGastos.filter((g) => !ehFatura(g)) : todosGastos;
}

const botoesFatura = document.querySelectorAll('.botao-fatura');

function atualizarBotoesFatura() {
  botoesFatura.forEach((botao) => {
    botao.textContent = semFatura ? 'Sem fatura' : 'Com fatura';
    botao.setAttribute('aria-pressed', String(semFatura));
    botao.classList.toggle('botao-filtros-ativo', semFatura);
  });
}

botoesFatura.forEach((botao) => botao.addEventListener('click', () => {
  semFatura = !semFatura;
  try { localStorage.setItem('semFatura', semFatura ? '1' : '0'); } catch (e) {}
  atualizarBotoesFatura();
  renderizarTudo();
}));

atualizarBotoesFatura();

// ---------- Cor do tema ----------

const MATIZ_PADRAO = 258; // roxo
const CORES_TEMA = [
  ['Roxo', 258],
  ['Azul', 222],
  ['Ciano', 188],
  ['Verde', 150],
  ['Âmbar', 38],
  ['Vermelho', 355],
  ['Rosa', 322],
];

const seletorCor = document.getElementById('seletor-cor');
const faixaMatiz = document.getElementById('faixa-matiz');
const metaCorTema = document.querySelector('meta[name="theme-color"]');

function lerMatizSalvo() {
  try {
    const salvo = localStorage.getItem('matiz');
    return salvo === null ? MATIZ_PADRAO : Number(salvo);
  } catch (e) {
    return MATIZ_PADRAO;
  }
}

function aplicarMatiz(matiz, salvar) {
  document.documentElement.style.setProperty('--matiz', matiz);
  metaCorTema.content = `hsl(${matiz} 41% 7%)`;
  faixaMatiz.value = matiz;
  seletorCor.querySelectorAll('.amostra-cor').forEach((amostra) => {
    amostra.setAttribute('aria-pressed', String(Number(amostra.dataset.matiz) === Number(matiz)));
  });
  if (salvar) {
    try { localStorage.setItem('matiz', String(matiz)); } catch (e) {}
  }
}

CORES_TEMA.forEach(([nome, matiz]) => {
  const amostra = document.createElement('button');
  amostra.type = 'button';
  amostra.className = 'amostra-cor';
  amostra.dataset.matiz = matiz;
  amostra.title = nome;
  amostra.setAttribute('aria-label', nome);
  amostra.style.backgroundImage =
    `linear-gradient(135deg, hsl(${matiz} 90% 66%), hsl(${matiz + 34} 70% 49%))`;
  amostra.addEventListener('click', () => aplicarMatiz(matiz, true));
  seletorCor.appendChild(amostra);
});

faixaMatiz.addEventListener('input', () => aplicarMatiz(Number(faixaMatiz.value), true));

aplicarMatiz(lerMatizSalvo(), false);

// ---------- Indicador online/offline ----------

// O badge só aparece quando falta internet
function atualizarRede() {
  statusRede.hidden = navigator.onLine;
}

// Altura do topo fixo, pros cabeçalhos de dia grudarem logo abaixo dele
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--altura-topo', `${topo.offsetHeight}px`);
}).observe(topo);

window.addEventListener('online', () => { atualizarRede(); carregar(); });
window.addEventListener('offline', atualizarRede);

// ---------- Início ----------

atualizarRede();
carregar();
