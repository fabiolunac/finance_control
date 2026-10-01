/* ============================================================
   Controle Pessoal — núcleo do app e módulo Finanças.
   Navegação por módulos (ver MODULOS, perto do fim), API, avisos,
   filtros, tema, e as telas de gastos, gráficos e fatura.
   Módulos novos vão em arquivos próprios, carregados depois deste.
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
const abaFatura = document.getElementById('aba-fatura');
const secaoTabela = document.getElementById('secao-tabela');
const secaoGraficos = document.getElementById('secao-graficos');
const secaoVisaoGeral = document.getElementById('secao-visao-geral');
const secaoParametros = document.getElementById('secao-parametros');
const secaoConfiguracoes = document.getElementById('secao-configuracoes');
const secaoFatura = document.getElementById('secao-fatura');

const metricaTotalGasto = document.getElementById('metrica-total-gasto');
const metricaLancamentos = document.getElementById('metrica-lancamentos');
const metricaComparacao = document.getElementById('metrica-comparacao');
const metricaFatura = document.getElementById('metrica-fatura');
const araujoContagem = document.getElementById('araujo-contagem');
const araujoDetalhe = document.getElementById('araujo-detalhe');
const corteQuando = document.getElementById('corte-quando');
const corteDetalhe = document.getElementById('corte-detalhe');
const cardUltimaCompra = document.getElementById('card-ultima-compra');
const ultimaCompraValor = document.getElementById('ultima-compra-valor');
const ultimaCompraDetalhe = document.getElementById('ultima-compra-detalhe');
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
const botaoLimparFiltros = document.getElementById('botao-limpar-filtros');
const botaoLimparFiltrosGrafico = document.getElementById('botao-limpar-filtros-grafico');

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

// Olho de esconder valores: todo valor em dinheiro passa por aqui, então
// esconder é só trocar o texto e redesenhar. Vale só no módulo que pede
// (ocultaValores em MODULOS); aplicarOcultacao liga e desliga.
let valoresOcultos = (() => {
  try { return localStorage.getItem('valoresOcultos') === '1'; } catch (e) { return false; }
})();
let ocultarValoresAgora = false;

function formatarMoeda(valor) {
  if (ocultarValoresAgora) return 'R$ ••••';
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
  if (!resposta.ok) {
    // Se o servidor explicou o motivo (ex.: 409), mostra ele; senão, a mensagem padrão
    let detalhe = null;
    try { detalhe = (await resposta.json()).detail; } catch (e) {}
    throw new Error(typeof detalhe === 'string' ? detalhe : mensagemErro);
  }
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
  if (!secaoFatura.hidden || !secaoConfiguracoes.hidden) carregarFatura();
  if (moduloAtual.aoAtualizar) moduloAtual.aoAtualizar();
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

// Gasto soma e Pagamento (dinheiro que volta: reembolso, estorno) desconta.
// Todas as telas somam por aqui, pra darem o mesmo número.
function valorLiquido(gasto) {
  if (gasto.tipo === 'Gasto') return gasto.Valor;
  if (gasto.tipo === 'Pagamento') return -gasto.Valor;
  return 0;
}

function calcularTotalGasto(gastos) {
  return gastos.reduce((soma, g) => soma + valorLiquido(g), 0);
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

// Desmarca tudo sem avisar quem depende do filtro (quem chama redesenha)
function limparMultiSelect(root) {
  root.selecionados.clear();
  root._lista.querySelectorAll('input[type="checkbox"]').forEach((caixa) => { caixa.checked = false; });
  atualizarTextoMultiSelect(root, root._campo, root._rotuloTodos);
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
    limparMultiSelect(root);
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
  botaoLimparFiltros.hidden = !filtrosTabela.some((root) => root.selecionados.size > 0);
}

// Todos os filtros da Tabela, inclusive o de mês
const filtrosTabela = [filtroMes, filtroCategoria, filtroCategoriaGeral, filtroLocal, filtroBanco];

botaoLimparFiltros.addEventListener('click', () => {
  filtrosTabela.forEach(limparMultiSelect);
  aplicarFiltros();
});

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
  [abaFatura, secaoFatura],
];

function selecionarAba(abaEscolhida) {
  abas.forEach(([aba, secao]) => {
    aba.classList.toggle('aba-ativa', aba === abaEscolhida);
    secao.hidden = aba !== abaEscolhida;
  });
  // Parâmetros fica dentro de Configurações: a engrenagem continua acesa
  if (abaEscolhida === abaParametros) abaConfiguracoes.classList.add('aba-ativa');
  erro.hidden = true;
  if (abaEscolhida === abaGraficos) atualizarGraficos();
  if (abaEscolhida === abaVisaoGeral) renderizarVisaoGeral();
  if (abaEscolhida === abaParametros) carregarParametros();
  if (abaEscolhida === abaFatura || abaEscolhida === abaConfiguracoes) carregarFatura();
  (aoAbrirAba.get(abaEscolhida) || []).forEach((funcao) => funcao());
}

abas.forEach(([aba]) => aba.addEventListener('click', () => selecionarAba(aba)));

// Pra módulos em outros arquivos acrescentarem suas abas; aoAbrir roda
// sempre que a aba for aberta (ex.: carregar os dados dela)
const aoAbrirAba = new Map(); // aba → lista de funções

// Também serve pra um módulo agir quando outra aba abre (ex.: Configurações)
function quandoAbrir(aba, funcao) {
  if (!aoAbrirAba.has(aba)) aoAbrirAba.set(aba, []);
  aoAbrirAba.get(aba).push(funcao);
}

function registrarAba(aba, secao, aoAbrir) {
  abas.push([aba, secao]);
  if (aoAbrir) quandoAbrir(aba, aoAbrir);
  aba.addEventListener('click', () => selecionarAba(aba));
}

document.getElementById('voltar-configuracoes').addEventListener('click', () => selecionarAba(abaConfiguracoes));

// ---------- Gráficos ----------

const filtrosGrafico = [graficoCategoria, graficoCategoriaGeral, graficoLocal];

function atualizarGraficos() {
  renderizarGrafico();
  atualizarGraficosDoMes();
  botaoLimparFiltrosGrafico.hidden = !filtrosGrafico.some((root) => root.selecionados.size > 0);
}

botaoLimparFiltrosGrafico.addEventListener('click', () => {
  filtrosGrafico.forEach(limparMultiSelect);
  atualizarGraficos();
});

// Gráficos que dependem do mês escolhido na aba: por dia e por categoria
function atualizarGraficosDoMes() {
  renderizarGraficoDiario();
  const gastosMes = gastosFiltradosGrafico().filter((g) => g['Mês'] === graficoDiaMes.value);
  renderizarGraficoCategoriasGerais(gastosMes);
  renderizarGraficoSubcategorias(gastosMes);
}

function renderizarGraficoCategoriasGerais(gastosMes) {
  const totais = {};
  gastosMes.forEach((g) => {
    totais[g['Categoria Geral']] = (totais[g['Categoria Geral']] || 0) + valorLiquido(g);
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
    barra.style.width = maximo > 0 ? `${(Math.max(valorTotal, 0) / maximo) * 100}%` : '0%';
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
    (g.tipo === 'Gasto' || g.tipo === 'Pagamento') &&
    multiSelectCombina(graficoCategoria, g.Categoria) &&
    multiSelectCombina(graficoCategoriaGeral, g['Categoria Geral']) &&
    multiSelectCombina(graficoLocal, g.Local)
  );
}

function renderizarGrafico() {
  const filtrados = gastosFiltradosGrafico();

  const totais = {};
  filtrados.forEach((g) => {
    totais[g['Mês']] = (totais[g['Mês']] || 0) + valorLiquido(g);
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
    opcao.textContent = nomeMesTitulo(mes);
    graficoDiaMes.appendChild(opcao);
  });

  if (meses.includes(atual)) graficoDiaMes.value = atual;
  atualizarPassoMes(graficoDiaMes);
}

function renderizarGraficoDiario() {
  const filtrados = gastosFiltradosGrafico().filter((g) => g['Mês'] === graficoDiaMes.value);

  const totais = {};
  filtrados.forEach((g) => {
    const data = g.Data.slice(0, 10);
    totais[data] = (totais[data] || 0) + valorLiquido(g);
  });

  const datas = Object.keys(totais).sort();
  graficoDiarioVazio.hidden = datas.length > 0;

  const entradas = datas.map((data) => {
    const [, mes, dia] = data.split('-');
    return [`${dia}/${mes}`, totais[data]];
  });
  renderizarBarras(graficoDiario, entradas);
}

ligarPassoMes(graficoDiaMes, atualizarGraficosDoMes);

botaoMesAtualDia.addEventListener('click', () => {
  graficoDiaMes.value = mesAtual();
  atualizarPassoMes(graficoDiaMes);
  atualizarGraficosDoMes();
});

// ---------- Seletor de mês com setas ----------
// As opções vêm do mais novo pro mais antigo: "anterior" (data-passo=1) desce na lista

function ligarPassoMes(select, aoMudar) {
  const setas = select.parentElement.querySelectorAll('.passo-mes-seta');
  setas.forEach((seta) => seta.addEventListener('click', () => {
    const indice = select.selectedIndex + Number(seta.dataset.passo);
    if (indice < 0 || indice >= select.options.length) return;
    select.selectedIndex = indice;
    atualizarPassoMes(select);
    aoMudar();
  }));
  select.addEventListener('change', () => {
    atualizarPassoMes(select);
    aoMudar();
  });
}

function atualizarPassoMes(select) {
  const [anterior, proximo] = select.parentElement.querySelectorAll('.passo-mes-seta');
  anterior.disabled = select.selectedIndex >= select.options.length - 1;
  proximo.disabled = select.selectedIndex <= 0;
}

function nomeMesTitulo(mes) {
  const nome = nomeMes(mes);
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

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
  renderizarUltimaCompra();
  renderizarAraujo();
  renderizarUltimoCorte();
  renderizarCalendario();
  renderizarGraficoSemanal();
}

ligarPassoMes(visaoMes, renderizarVisaoGeral);

botaoMesAtualVisao.addEventListener('click', () => {
  visaoMes.value = mesAtual();
  atualizarPassoMes(visaoMes);
  renderizarVisaoGeral();
});

// ---------- Gastos por categoria (nível detalhado) ----------

// Acima disso as menores viram uma barra só de "Outras", pra lista não ficar enorme
const LIMITE_CATEGORIAS = 10;

function renderizarGraficoSubcategorias(gastosMes) {
  const totais = {};
  const geraisPorCategoria = {}; // pra pintar a barra com a cor da categoria geral
  gastosMes.forEach((g) => {
    totais[g.Categoria] = (totais[g.Categoria] || 0) + valorLiquido(g);
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

// Gasto mais recente de todo o histórico, sem contar o pagamento da fatura
// (não é compra). Tocar no card abre ele pra editar.
let ultimaCompra = null;

function renderizarUltimaCompra() {
  const compras = todosGastos.filter((g) => g.tipo === 'Gasto' && !ehFatura(g));
  ultimaCompra = compras.length ? maisRecente(compras) : null;
  cardUltimaCompra.disabled = !ultimaCompra;
  if (!ultimaCompra) {
    ultimaCompraValor.textContent = '—';
    ultimaCompraDetalhe.textContent = 'Nenhuma compra registrada';
    return;
  }
  ultimaCompraValor.textContent = formatarMoeda(ultimaCompra.Valor);
  ultimaCompraDetalhe.textContent = `${ultimaCompra.Local} · ${textoDiasAtras(ultimaCompra.Data)}`;
}

cardUltimaCompra.addEventListener('click', () => {
  if (ultimaCompra) abrirGaveta(ultimaCompra);
});

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

  const gastoSemana = calcularTotalGasto(gastosConsiderados().filter((g) => {
    const data = g.Data.slice(0, 10);
    return data >= inicioIso && data <= fimIso;
  }));

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
    opcao.textContent = nomeMesTitulo(mes);
    visaoMes.appendChild(opcao);
  });

  if (meses.includes(atual)) visaoMes.value = atual;
  else if (meses.includes(mesAtual())) visaoMes.value = mesAtual();
  atualizarPassoMes(visaoMes);
}

function renderizarGraficoSemanal() {
  const mes = mesSelecionado();
  const gastosMes = gastosConsiderados().filter((g) =>
    (g.tipo === 'Gasto' || g.tipo === 'Pagamento') && g['Mês'] === mes);

  const totais = {};
  gastosMes.forEach((g) => {
    const chave = formatarIso(inicioSemana(dataLocal(g.Data.slice(0, 10))));
    totais[chave] = (totais[chave] || 0) + valorLiquido(g);
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
    if (g.tipo !== 'Gasto' && g.tipo !== 'Pagamento') return;
    const data = g.Data.slice(0, 10);
    if (data.slice(0, 7) !== mes) return;
    totaisPorDia[data] = (totaisPorDia[data] || 0) + valorLiquido(g);
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
    const temLancamento = total !== undefined;
    const celula = document.createElement(temLancamento ? 'button' : 'span');
    celula.className = 'calendario-dia';
    celula.textContent = String(dia);

    if (iso === hoje) celula.classList.add('calendario-hoje');

    // Dia com gasto: cor mais forte quanto maior o total, e tocável
    if (temLancamento) {
      celula.type = 'button';
      celula.classList.add('calendario-com-gasto');
      celula.style.setProperty('--intensidade', (maximo > 0 ? Math.max(total, 0) / maximo : 0).toFixed(2));
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
    ? gastosConsiderados().filter((g) =>
      (g.tipo === 'Gasto' || g.tipo === 'Pagamento') && g.Data.slice(0, 10) === diaCalendario)
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
    // Pagamento aparece como valor que volta: sinal de menos e verde
    valor.textContent = formatarMoeda(valorLiquido(gasto));
    valor.classList.toggle('valor-que-volta', gasto.tipo === 'Pagamento');
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

// O "+" faz o que o módulo ativo definir (ver MODULOS); sem ação, ele some
botaoAdicionar.addEventListener('click', () => {
  if (moduloAtual.aoAdicionar) moduloAtual.aoAdicionar();
});
botaoFecharGaveta.addEventListener('click', () => gavetaAdicionar.close());

// Clique no fundo escurecido (fora do corpo da gaveta) fecha
gavetaAdicionar.addEventListener('click', (evento) => {
  if (evento.target === gavetaAdicionar) gavetaAdicionar.close();
});

// ---------- Notificação e "Desfazer" ----------

let notificacaoTimer = null;

// A gaveta aberta fica acima de tudo; pra aparecer, o aviso entra nela
function moverNotificacao() {
  const gavetaAberta = document.querySelector('dialog[open]');
  const destino = gavetaAberta || document.body;
  if (notificacao.parentElement !== destino) destino.appendChild(notificacao);
  notificacao.classList.toggle('notificacao-na-gaveta', Boolean(gavetaAberta));
}

document.querySelectorAll('dialog').forEach((gaveta) => gaveta.addEventListener('close', moverNotificacao));

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

// ---------- Fatura do cartão ----------

// Compras parceladas por cartão; cada fatura é identificada pelo mês de
// vencimento (YYYY-MM), como no app do banco
let cartoes = [];
let compras = [];
let faturasPagas = [];
let mesFatura = null; // fatura mostrada na aba
const comprasRemovendo = new Set();

const faturaMesNome = document.getElementById('fatura-mes-nome');
const faturaTotal = document.getElementById('fatura-total');
const faturaSub = document.getElementById('fatura-sub');
const faturaCartoes = document.getElementById('fatura-cartoes');
const faturaSemCartao = document.getElementById('fatura-sem-cartao');
const graficoFaturaFuturo = document.getElementById('grafico-fatura-futuro');
const botaoNovaCompra = document.getElementById('botao-nova-compra');

const gavetaCompra = document.getElementById('gaveta-compra');
const gavetaCompraTitulo = document.getElementById('gaveta-compra-titulo');
const formCompra = document.getElementById('form-compra');
const compraValor = document.getElementById('compra-valor');
const compraDescricao = document.getElementById('compra-descricao');
const compraData = document.getElementById('compra-data');
const compraParcelas = document.getElementById('compra-parcelas');
const compraCartao = document.getElementById('compra-cartao');
const compraPrevia = document.getElementById('compra-previa');
const botaoSalvarCompra = document.getElementById('botao-salvar-compra');
const botaoExcluirCompra = document.getElementById('botao-excluir-compra');
const erroCompra = document.getElementById('erro-compra');
const campoPessoas = document.getElementById('campo-pessoas');
const rotuloPessoas = document.getElementById('rotulo-pessoas');
const compraPessoas = document.getElementById('compra-pessoas');
const opcoesPessoas = document.getElementById('opcoes-pessoas');
const faturaReceber = document.getElementById('fatura-receber');
const listaReceber = document.getElementById('lista-receber');

const listaCartoes = document.getElementById('lista-cartoes');
const formCartao = document.getElementById('form-cartao');

async function carregarFatura() {
  erro.hidden = true;
  try {
    const resposta = await requisitar('GET', '/api/fatura', null, 'Erro ao carregar a fatura.');
    const dados = await resposta.json();
    cartoes = dados.cartoes;
    compras = dados.compras.filter((c) => !comprasRemovendo.has(c.id));
    faturasPagas = dados.pagas;
    if (!mesFatura) mesFatura = proximaFaturaAVencer();
    renderizarFatura();
    renderizarCartoes();
  } catch (e) {
    mostrarErro(e.message);
  }
}

// ----- Contas de meses e parcelas

const pad2 = (n) => String(n).padStart(2, '0');

function somarMeses(mes, n) {
  const [ano, m] = mes.split('-').map(Number);
  return formatarIso(new Date(ano, m - 1 + n, 1)).slice(0, 7);
}

function mesesEntre(de, ate) {
  const [a1, m1] = de.split('-').map(Number);
  const [a2, m2] = ate.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

function nomeMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${ano}`;
}

function nomeMesCurto(mes) {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1].slice(0, 3)}/${String(ano).slice(2)}`;
}

// Dia 31 num mês de 30 dias vira 30, e assim por diante
function diaNoMes(mes, dia) {
  const [ano, m] = mes.split('-').map(Number);
  return Math.min(dia, new Date(ano, m, 0).getDate());
}

// Fatura da 1ª parcela: compra a partir do dia de fechamento vai pra fatura
// seguinte; se o vencimento vem antes do fechamento no calendário, a fatura
// fechada num mês vence no mês seguinte
function primeiraFatura(dataCompra, cartao) {
  const [ano, m, dia] = dataCompra.split('-').map(Number);
  let fechamento = `${ano}-${pad2(m)}`;
  if (dia >= diaNoMes(fechamento, cartao.Fechamento)) fechamento = somarMeses(fechamento, 1);
  return cartao.Vencimento > cartao.Fechamento ? fechamento : somarMeses(fechamento, 1);
}

// Divide em centavos; a última parcela leva a sobra do arredondamento
function valorDaParcela(total, parcelas, numero) {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / parcelas);
  return (numero === parcelas ? centavos - base * (parcelas - 1) : base) / 100;
}

function parcelasDaFatura(mes, cartaoId) {
  const cartao = cartoes.find((c) => c.id === cartaoId);
  if (!cartao) return [];
  return compras
    .filter((compra) => compra.Cartao === cartaoId)
    .map((compra) => {
      const indice = mesesEntre(primeiraFatura(compra.Data, cartao), mes);
      if (indice < 0 || indice >= compra.Parcelas) return null;
      const valor = valorDaParcela(compra.Valor, compra.Parcelas, indice + 1);
      return { compra, numero: indice + 1, valor, partes: partesDaParcela(compra, valor) };
    })
    .filter(Boolean);
}

const somarParcelas = (parcelas) => parcelas.reduce((soma, p) => soma + p.valor, 0);
const somarMinhaParte = (parcelas) => parcelas.reduce((soma, p) => soma + p.partes.minha, 0);

// Quanto da parcela é seu e quanto é de cada pessoa. "dividida": partes iguais
// entre você e as pessoas (a sobra dos centavos fica com você); "outra": tudo
// das pessoas, e a sobra fica com a primeira
function partesDaParcela(compra, valor) {
  const divisao = compra.Divisao;
  if (!divisao || !divisao.pessoas || !divisao.pessoas.length) return { minha: valor, outros: {} };

  const pessoas = divisao.pessoas;
  const centavos = Math.round(valor * 100);
  const cabecas = divisao.tipo === 'dividida' ? pessoas.length + 1 : pessoas.length;
  const base = Math.floor(centavos / cabecas);
  const sobra = centavos - base * cabecas;

  const outros = {};
  pessoas.forEach((pessoa) => { outros[pessoa] = base / 100; });
  if (divisao.tipo === 'dividida') return { minha: (base + sobra) / 100, outros };
  outros[pessoas[0]] = (base + sobra) / 100;
  return { minha: 0, outros };
}

function textoDivisao(divisao) {
  if (!divisao) return '';
  return divisao.tipo === 'dividida'
    ? `Dividida com ${divisao.pessoas.join(', ')}`
    : `De ${divisao.pessoas.join(', ')}`;
}

// Fatura mais próxima que ainda não venceu, considerando todos os cartões
function proximaFaturaAVencer() {
  const mes = mesAtual();
  if (!cartoes.length) return mes;
  const hoje = new Date().getDate();
  return cartoes
    .map((c) => (hoje <= diaNoMes(mes, c.Vencimento) ? mes : somarMeses(mes, 1)))
    .sort()[0];
}

function textoParcelas(n) {
  return `${n} ${n === 1 ? 'parcela' : 'parcelas'}`;
}

// ----- Tela da fatura

function renderizarFatura() {
  const nome = nomeMes(mesFatura);
  faturaMesNome.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  faturaSemCartao.hidden = cartoes.length > 0;
  botaoNovaCompra.disabled = cartoes.length === 0;

  let total = 0;
  let aPagar = 0;
  let minhaParte = 0;
  let quantidade = 0;
  const aReceber = {}; // pessoa → { valor, compras }
  faturaCartoes.innerHTML = '';

  cartoes.forEach((cartao) => {
    const parcelas = parcelasDaFatura(mesFatura, cartao.id);
    const totalCartao = somarParcelas(parcelas);
    const paga = faturasPagas.find((p) => p.Cartao === cartao.id && p.Mes === mesFatura);
    total += totalCartao;
    minhaParte += somarMinhaParte(parcelas);
    quantidade += parcelas.length;
    if (!paga) aPagar += totalCartao;
    parcelas.forEach(({ partes }) => {
      Object.entries(partes.outros).forEach(([pessoa, valor]) => {
        const conta = (aReceber[pessoa] = aReceber[pessoa] || { valor: 0, compras: 0 });
        conta.valor += valor;
        conta.compras += 1;
      });
    });
    faturaCartoes.appendChild(criarBlocoCartao(cartao, parcelas, totalCartao, paga));
  });

  animarValor(faturaTotal, total);
  const partes = [textoParcelas(quantidade)];
  if (minhaParte < total - 0.005) partes.push(`sua parte ${formatarMoeda(minhaParte)}`);
  if (total > 0 && aPagar < 0.005) partes.push('tudo pago');
  else if (aPagar < total - 0.005) partes.push(`${formatarMoeda(aPagar)} a pagar`);
  faturaSub.textContent = cartoes.length ? partes.join(' · ') : '';

  renderizarAReceber(aReceber);

  renderizarFaturaFutura();
}

function dataCurta(mes, dia) {
  return `${pad2(diaNoMes(mes, dia))}/${mes.slice(5)}`;
}

function criarBlocoCartao(cartao, parcelas, totalCartao, paga) {
  const bloco = document.createElement('div');
  bloco.className = 'cartao-grafico fatura-cartao';

  const mesFechamento = cartao.Vencimento > cartao.Fechamento ? mesFatura : somarMeses(mesFatura, -1);
  const cabecalho = document.createElement('div');
  cabecalho.className = 'fatura-cartao-cabecalho';
  const titulo = document.createElement('div');
  const nome = document.createElement('h3');
  nome.className = 'fatura-cartao-nome';
  nome.textContent = cartao.Nome;
  const datas = document.createElement('span');
  datas.className = 'fatura-cartao-datas';
  datas.textContent = `vence ${dataCurta(mesFatura, cartao.Vencimento)} · fecha ${dataCurta(mesFechamento, cartao.Fechamento)}`;
  titulo.append(nome, datas);
  const totais = document.createElement('div');
  totais.className = 'fatura-cartao-totais';
  const valor = document.createElement('span');
  valor.className = 'fatura-cartao-total';
  valor.textContent = formatarMoeda(totalCartao);
  totais.appendChild(valor);
  const minha = somarMinhaParte(parcelas);
  if (minha < totalCartao - 0.005) {
    const parte = document.createElement('span');
    parte.className = 'fatura-cartao-parte';
    parte.textContent = `sua parte ${formatarMoeda(minha)}`;
    totais.appendChild(parte);
  }
  cabecalho.append(titulo, totais);
  bloco.appendChild(cabecalho);

  bloco.appendChild(criarStatusFatura(cartao, totalCartao, paga));

  if (!parcelas.length) {
    const vazioBloco = document.createElement('p');
    vazioBloco.className = 'vazio-pequeno';
    vazioBloco.textContent = 'Nenhuma parcela nesta fatura.';
    bloco.appendChild(vazioBloco);
    return bloco;
  }

  const lista = document.createElement('div');
  lista.className = 'fatura-parcelas';

  parcelas
    .sort((a, b) => b.compra.Data.localeCompare(a.compra.Data))
    .forEach(({ compra, numero, valor: valorParcela, partes }) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'mini-lista-item';
      const textos = document.createElement('span');
      textos.className = 'parcela-textos';
      const descricao = document.createElement('span');
      descricao.className = 'parcela-descricao';
      descricao.textContent = compra.Descricao;
      const info = document.createElement('span');
      info.className = 'parcela-info';
      info.textContent = `${compra.Parcelas > 1 ? `${numero}/${compra.Parcelas}` : 'à vista'} · compra em ${formatarData(compra.Data).slice(0, 5)}`;
      textos.append(descricao, info);
      if (compra.Divisao) {
        const divisao = document.createElement('span');
        divisao.className = 'parcela-divisao';
        divisao.textContent = compra.Divisao.tipo === 'dividida'
          ? `${textoDivisao(compra.Divisao)} · sua parte ${formatarMoeda(partes.minha)}`
          : textoDivisao(compra.Divisao);
        textos.appendChild(divisao);
      }
      const valorItem = document.createElement('span');
      valorItem.className = 'mini-lista-valor';
      valorItem.textContent = formatarMoeda(valorParcela);
      item.append(textos, valorItem);
      item.addEventListener('click', () => abrirGavetaCompra(compra));
      lista.appendChild(item);
    });

  bloco.append(lista, criarAlternadorParcelas(cartao.id, parcelas.length, lista));
  return bloco;
}

// Lista de lançamentos de cada cartão pode ser recolhida. Sem escolha salva,
// começa aberta até 5 lançamentos e recolhida acima disso.
const LANCAMENTOS_ABERTOS_POR_PADRAO = 5;

let listasFatura = (() => {
  try { return JSON.parse(localStorage.getItem('listasFatura')) || {}; } catch (e) { return {}; }
})();

function listaFaturaAberta(cartaoId, quantidade) {
  const salvo = listasFatura[cartaoId];
  return salvo === undefined ? quantidade <= LANCAMENTOS_ABERTOS_POR_PADRAO : salvo;
}

function criarAlternadorParcelas(cartaoId, quantidade, lista) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'alternar-parcelas';
  const texto = document.createElement('span');
  const seta = document.createElement('span');
  seta.className = 'alternar-parcelas-seta';
  seta.setAttribute('aria-hidden', 'true');
  seta.innerHTML = SETA_SVG;
  botao.append(texto, seta);

  const aplicar = (aberta) => {
    lista.hidden = !aberta;
    botao.classList.toggle('alternar-parcelas-aberta', aberta);
    botao.setAttribute('aria-expanded', String(aberta));
    texto.textContent = aberta ? 'Recolher lançamentos' : `Ver ${textoLancamentos(quantidade)}`;
  };
  aplicar(listaFaturaAberta(cartaoId, quantidade));

  botao.addEventListener('click', () => {
    const aberta = lista.hidden;
    listasFatura[cartaoId] = aberta;
    try { localStorage.setItem('listasFatura', JSON.stringify(listasFatura)); } catch (e) {}
    aplicar(aberta);
  });
  return botao;
}

// Paga: selo verde e "Desfazer". Não paga: botão que abre data e banco do pagamento
function criarStatusFatura(cartao, totalCartao, paga) {
  const status = document.createElement('div');
  status.className = 'fatura-status';

  if (paga) {
    const selo = document.createElement('span');
    selo.className = 'fatura-paga';
    selo.textContent = `✓ Paga em ${formatarData(paga.Data).slice(0, 5)}`;
    const desfazer = document.createElement('button');
    desfazer.type = 'button';
    desfazer.className = 'multiselect-acao';
    desfazer.textContent = 'Desfazer';
    desfazer.addEventListener('click', () => desfazerPagamento(paga));
    status.append(selo, desfazer);

    // Compras mudaram depois do pagamento: o gasto lançado não bate mais
    if (Math.abs(paga.Valor - totalCartao) >= 0.005) {
      const aviso = document.createElement('span');
      aviso.className = 'fatura-aviso';
      aviso.textContent = `Pago ${formatarMoeda(paga.Valor)}, mas o total atual é ${formatarMoeda(totalCartao)}.`;
      status.appendChild(aviso);
    }
    return status;
  }

  if (totalCartao <= 0) return status;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-secundario';
  botao.textContent = 'Marcar como paga';

  const form = document.createElement('form');
  form.className = 'fatura-pagar';
  form.hidden = true;
  const campoDataPagamento = document.createElement('input');
  campoDataPagamento.type = 'date';
  campoDataPagamento.required = true;
  campoDataPagamento.value = formatarIso(new Date());
  campoDataPagamento.setAttribute('aria-label', 'Data do pagamento');
  const campoBancoPagamento = document.createElement('input');
  campoBancoPagamento.type = 'text';
  campoBancoPagamento.setAttribute('list', 'opcoes-banco');
  campoBancoPagamento.placeholder = 'Pago com (banco)';
  campoBancoPagamento.autocomplete = 'off';
  campoBancoPagamento.required = true;
  campoBancoPagamento.value = lerUltimoBanco();
  campoBancoPagamento.setAttribute('aria-label', 'Banco do pagamento');
  const confirmar = document.createElement('button');
  confirmar.type = 'submit';
  confirmar.className = 'botao-primario';
  confirmar.textContent = `Pagar ${formatarMoeda(totalCartao)}`;
  form.append(campoDataPagamento, campoBancoPagamento, confirmar);

  botao.addEventListener('click', () => {
    form.hidden = !form.hidden;
    botao.hidden = !form.hidden;
  });
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    pagarFatura(cartao, totalCartao, campoDataPagamento.value, campoBancoPagamento.value.trim(), confirmar);
  });

  status.append(botao, form);
  return status;
}

function renderizarAReceber(aReceber) {
  const pessoas = Object.keys(aReceber).sort((a, b) => aReceber[b].valor - aReceber[a].valor);
  faturaReceber.hidden = pessoas.length === 0;
  listaReceber.innerHTML = '';
  pessoas.forEach((pessoa) => {
    const linha = document.createElement('div');
    linha.className = 'mini-lista-item receber-item';
    const textos = document.createElement('span');
    textos.className = 'parcela-textos';
    const nome = document.createElement('span');
    nome.className = 'parcela-descricao';
    nome.textContent = pessoa;
    const info = document.createElement('span');
    info.className = 'parcela-info';
    info.textContent = textoParcelas(aReceber[pessoa].compras);
    textos.append(nome, info);
    const valor = document.createElement('span');
    valor.className = 'mini-lista-valor';
    valor.textContent = formatarMoeda(aReceber[pessoa].valor);
    linha.append(textos, valor);
    listaReceber.appendChild(linha);
  });
}

function renderizarFaturaFutura() {
  const entradas = [];
  for (let i = 0; i < 6; i += 1) {
    const mes = somarMeses(mesFatura, i);
    const total = cartoes.reduce((soma, c) => soma + somarParcelas(parcelasDaFatura(mes, c.id)), 0);
    entradas.push([nomeMesCurto(mes), total]);
  }
  renderizarBarras(graficoFaturaFuturo, entradas);
}

document.getElementById('fatura-anterior').addEventListener('click', () => {
  mesFatura = somarMeses(mesFatura, -1);
  renderizarFatura();
});

document.getElementById('fatura-proxima').addEventListener('click', () => {
  mesFatura = somarMeses(mesFatura, 1);
  renderizarFatura();
});

document.getElementById('botao-ir-cartoes').addEventListener('click', () => {
  selecionarAba(abaConfiguracoes);
  document.getElementById('cartao-cartoes').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ----- Pagamento

async function pagarFatura(cartao, total, data, banco, botao) {
  if (!data || !banco) return;
  erro.hidden = true;
  botao.disabled = true;
  try {
    await requisitar('POST', '/api/faturas/pagar',
      { Cartao: cartao.id, Mes: mesFatura, Valor: Math.round(total * 100) / 100, Data: data, banco },
      'Erro ao marcar a fatura como paga.');
    salvarUltimoBanco(banco);
    mostrarNotificacao(`Fatura ${cartao.Nome} paga · ${formatarMoeda(total)} lançado nos gastos`);
    await Promise.all([carregarFatura(), carregar()]);
  } catch (e) {
    mostrarErro(e.message);
    botao.disabled = false;
  }
}

async function desfazerPagamento(paga) {
  erro.hidden = true;
  try {
    await requisitar('DELETE', `/api/faturas/pagas/${paga.id}`, null, 'Erro ao desfazer o pagamento.');
    mostrarNotificacao('Pagamento desfeito; o gasto da fatura foi removido');
    await Promise.all([carregarFatura(), carregar()]);
  } catch (e) {
    mostrarErro(e.message);
  }
}

// ----- Gaveta de compra

let compraEditando = null;

function preencherOpcoesCartao() {
  compraCartao.innerHTML = '';
  cartoes.forEach((cartao) => {
    const opcao = document.createElement('option');
    opcao.value = cartao.id;
    opcao.textContent = cartao.Nome;
    compraCartao.appendChild(opcao);
  });
}

function lerUltimoCartao() {
  try { return Number(localStorage.getItem('ultimoCartao')); } catch (e) { return null; }
}

function lerPessoas() {
  const nomes = compraPessoas.value.split(',').map((p) => p.trim()).filter(Boolean);
  return [...new Set(nomes)];
}

// "Só minha" esconde o campo de pessoas; os outros dois mostram com o rótulo certo
function atualizarCampoPessoas() {
  const tipo = formCompra.elements.divisao.value;
  campoPessoas.hidden = tipo === 'minha';
  compraPessoas.required = tipo !== 'minha';
  rotuloPessoas.textContent = tipo === 'outra' ? 'De quem é' : 'Com quem (separe por vírgula)';
  compraPessoas.placeholder = tipo === 'outra' ? 'Ex.: Ana' : 'Ex.: Ana, Bia';
}

function divisaoDoFormulario() {
  const tipo = formCompra.elements.divisao.value;
  if (tipo === 'minha') return null;
  const pessoas = lerPessoas();
  return pessoas.length ? { tipo, pessoas } : null;
}

// Nomes já usados em outras compras, pra sugerir
function preencherOpcoesPessoas() {
  const nomes = new Set();
  compras.forEach((c) => (c.Divisao ? c.Divisao.pessoas : []).forEach((p) => nomes.add(p)));
  preencherDatalist(opcoesPessoas, [...nomes].sort((a, b) => a.localeCompare(b)));
}

formCompra.querySelectorAll('input[name="divisao"]').forEach((opcao) => {
  opcao.addEventListener('change', () => {
    atualizarCampoPessoas();
    atualizarPreviaCompra();
  });
});
compraPessoas.addEventListener('input', atualizarPreviaCompra);

function abrirGavetaCompra(compra = null) {
  compraEditando = compra;
  erroCompra.hidden = true;
  gavetaCompraTitulo.textContent = compra ? 'Editar compra' : 'Nova compra';
  botaoSalvarCompra.textContent = compra ? 'Salvar' : 'Adicionar';
  botaoExcluirCompra.hidden = !compra;
  preencherOpcoesCartao();

  if (compra) {
    compraValor.value = String(compra.Valor).replace('.', ',');
    compraDescricao.value = compra.Descricao;
    compraData.value = compra.Data;
    compraParcelas.value = compra.Parcelas;
    compraCartao.value = compra.Cartao;
    formCompra.elements.divisao.value = compra.Divisao ? compra.Divisao.tipo : 'minha';
    compraPessoas.value = compra.Divisao ? compra.Divisao.pessoas.join(', ') : '';
  } else {
    compraValor.value = '';
    compraDescricao.value = '';
    compraData.value = formatarIso(new Date());
    compraParcelas.value = 1;
    formCompra.elements.divisao.value = 'minha';
    compraPessoas.value = '';
    const ultimo = lerUltimoCartao();
    if (cartoes.some((c) => c.id === ultimo)) compraCartao.value = ultimo;
  }

  preencherOpcoesPessoas();
  atualizarCampoPessoas();
  atualizarPreviaCompra();
  gavetaCompra.showModal();
  if (!compra) compraValor.focus();
}

// Mostra como a compra vai se espalhar antes de salvar
function atualizarPreviaCompra() {
  const total = lerValor(compraValor.value);
  const parcelas = parseInt(compraParcelas.value, 10);
  const cartao = cartoes.find((c) => c.id === Number(compraCartao.value));
  if (!cartao || !compraData.value || !(parcelas >= 1) || !(total > 0)) {
    compraPrevia.textContent = '';
    return;
  }
  const primeira = primeiraFatura(compraData.value, cartao);
  const valorParcela = valorDaParcela(total, parcelas, 1);
  const linhas = [parcelas === 1
    ? `À vista · fatura de ${nomeMes(primeira)}`
    : `${parcelas}× de ${formatarMoeda(valorParcela)} · de ${nomeMes(primeira)} a ${nomeMes(somarMeses(primeira, parcelas - 1))}`];

  const divisao = divisaoDoFormulario();
  if (divisao) {
    const partes = partesDaParcela({ Divisao: divisao }, valorParcela);
    const porParcela = parcelas > 1 ? ' por parcela' : '';
    linhas.push(divisao.tipo === 'dividida'
      ? `Sua parte ${formatarMoeda(partes.minha)}${porParcela} · ${divisao.pessoas.length === 1 ? divisao.pessoas[0] : 'cada um'} ${formatarMoeda(partes.outros[divisao.pessoas[0]])}`
      : `Você não paga nada · ${divisao.pessoas.join(', ')} ${formatarMoeda(partes.outros[divisao.pessoas[0]])}${divisao.pessoas.length > 1 ? ' cada' : ''}${porParcela}`);
  }
  compraPrevia.textContent = linhas.join('\n');
}

[compraValor, compraParcelas, compraData, compraCartao].forEach((campo) => {
  campo.addEventListener('input', atualizarPreviaCompra);
});

async function salvarCompra(evento) {
  evento.preventDefault();
  erroCompra.hidden = true;

  const compra = {
    Data: compraData.value,
    Descricao: compraDescricao.value.trim(),
    Valor: lerValor(compraValor.value),
    Parcelas: parseInt(compraParcelas.value, 10),
    Cartao: Number(compraCartao.value),
    Divisao: divisaoDoFormulario(),
  };

  if (formCompra.elements.divisao.value !== 'minha' && !compra.Divisao) {
    erroCompra.textContent = 'Informe com quem a compra é dividida, ou de quem ela é.';
    erroCompra.hidden = false;
    return;
  }

  if (!(compra.Valor > 0)) {
    erroCompra.textContent = 'Valor inválido. Use algo como 1.200,00.';
    erroCompra.hidden = false;
    return;
  }
  if (!compra.Data || !compra.Descricao || !(compra.Parcelas >= 1 && compra.Parcelas <= 48) || !compra.Cartao) return;

  const editando = compraEditando;
  botaoSalvarCompra.disabled = true;
  try {
    if (editando) {
      await requisitar('PUT', `/api/compras/${editando.id}`, compra, 'Erro ao salvar a compra.');
    } else {
      await requisitar('POST', '/api/compras', compra, 'Erro ao gravar a compra.');
    }
    try { localStorage.setItem('ultimoCartao', String(compra.Cartao)); } catch (e) {}
    gavetaCompra.close();
    const primeira = primeiraFatura(compra.Data, cartoes.find((c) => c.id === compra.Cartao));
    mostrarNotificacao(editando
      ? 'Compra atualizada'
      : `${compra.Descricao} · 1ª parcela na fatura de ${nomeMes(primeira)}`);
    await carregarFatura();
  } catch (e) {
    erroCompra.textContent = e.message;
    erroCompra.hidden = false;
  } finally {
    botaoSalvarCompra.disabled = false;
  }
}

formCompra.addEventListener('submit', salvarCompra);
botaoNovaCompra.addEventListener('click', () => abrirGavetaCompra());
document.getElementById('botao-fechar-compra').addEventListener('click', () => gavetaCompra.close());
gavetaCompra.addEventListener('click', (evento) => {
  if (evento.target === gavetaCompra) gavetaCompra.close();
});

botaoExcluirCompra.addEventListener('click', () => {
  const compra = compraEditando;
  gavetaCompra.close();
  removerCompra(compra);
});

function removerCompra(compra) {
  erro.hidden = true;
  removerComDesfazer(`Compra removida: ${compra.Descricao}`, {
    tirar: () => {
      comprasRemovendo.add(compra.id);
      compras = compras.filter((c) => c.id !== compra.id);
      renderizarFatura();
    },
    devolver: () => {
      comprasRemovendo.delete(compra.id);
      compras = [...compras, compra];
      renderizarFatura();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/compras/${compra.id}`, null, 'Erro ao remover a compra.');
      } catch (e) {
        mostrarErro(e.message);
        comprasRemovendo.delete(compra.id);
        carregarFatura();
        return;
      }
      comprasRemovendo.delete(compra.id);
    },
  });
}

// ----- Cartões (em Configurações)

function lerCamposCartao(nome, fechamento, vencimento) {
  return {
    Nome: nome.value.trim(),
    Fechamento: parseInt(fechamento.value, 10),
    Vencimento: parseInt(vencimento.value, 10),
  };
}

function criarCampoNumero(valor, placeholder) {
  const campo = document.createElement('input');
  campo.type = 'number';
  campo.inputMode = 'numeric';
  campo.min = 1;
  campo.max = 31;
  campo.required = true;
  campo.placeholder = placeholder;
  campo.value = valor;
  campo.setAttribute('aria-label', placeholder);
  return campo;
}

function renderizarCartoes() {
  listaCartoes.innerHTML = '';
  cartoes.forEach((cartao) => {
    const form = document.createElement('form');
    form.className = 'pendente';

    const info = document.createElement('div');
    info.className = 'pendente-info';
    const nome = document.createElement('span');
    nome.className = 'pendente-local';
    nome.textContent = cartao.Nome;
    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'botao-remover';
    remover.textContent = '×';
    remover.setAttribute('aria-label', `Remover cartão ${cartao.Nome}`);
    remover.addEventListener('click', () => removerCartao(cartao));
    info.append(nome, remover);

    const campoNome = document.createElement('input');
    campoNome.type = 'text';
    campoNome.maxLength = 60;
    campoNome.required = true;
    campoNome.value = cartao.Nome;
    campoNome.setAttribute('aria-label', 'Nome do cartão');
    const campoFechamento = criarCampoNumero(cartao.Fechamento, 'Fecha dia');
    const campoVencimento = criarCampoNumero(cartao.Vencimento, 'Vence dia');
    const salvar = document.createElement('button');
    salvar.type = 'submit';
    salvar.className = 'botao-primario';
    salvar.textContent = 'Salvar';

    const campos = document.createElement('div');
    campos.className = 'cartao-campos';
    campos.append(campoNome, campoFechamento, campoVencimento, salvar);
    form.append(info, campos);

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      salvar.disabled = true;
      try {
        await requisitar('PUT', `/api/cartoes/${cartao.id}`,
          lerCamposCartao(campoNome, campoFechamento, campoVencimento), 'Erro ao salvar o cartão.');
        mostrarNotificacao('Cartão atualizado');
        await carregarFatura();
      } catch (e) {
        mostrarErro(e.message);
      } finally {
        salvar.disabled = false;
      }
    });

    listaCartoes.appendChild(form);
  });
}

formCartao.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const campos = lerCamposCartao(
    document.getElementById('cartao-nome'),
    document.getElementById('cartao-fechamento'),
    document.getElementById('cartao-vencimento'));
  if (!campos.Nome || !(campos.Fechamento >= 1) || !(campos.Vencimento >= 1)) return;

  erro.hidden = true;
  try {
    await requisitar('POST', '/api/cartoes', campos, 'Erro ao gravar o cartão.');
    formCartao.reset();
    mostrarNotificacao(`Cartão ${campos.Nome} adicionado`);
    mesFatura = null; // recalcula a próxima fatura com o cartão novo
    await carregarFatura();
  } catch (e) {
    mostrarErro(e.message);
  }
});

// O servidor recusa remover cartão com compras; a mensagem dele aparece no erro
async function removerCartao(cartao) {
  erro.hidden = true;
  try {
    await requisitar('DELETE', `/api/cartoes/${cartao.id}`, null, 'Erro ao remover o cartão.');
    mostrarNotificacao(`Cartão ${cartao.Nome} removido`);
    await carregarFatura();
  } catch (e) {
    mostrarErro(e.message);
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

// ---------- Notificações push ----------
// O servidor manda o push (ex.: cafeína perto do limite); aqui só ativa,
// testa e desativa neste aparelho. No iPhone, só com o app na tela de início.

const notifEstado = document.getElementById('notif-estado');
const botaoNotifAtivar = document.getElementById('botao-notif-ativar');
const botaoNotifTeste = document.getElementById('botao-notif-teste');
const botaoNotifDesativar = document.getElementById('botao-notif-desativar');

const pushSuportado = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Chave VAPID em base64url → bytes, como o pushManager.subscribe pede
function chaveParaBytes(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function inscricaoAtual() {
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

async function atualizarEstadoNotificacoes() {
  [botaoNotifAtivar, botaoNotifTeste, botaoNotifDesativar].forEach((b) => { b.hidden = true; });
  if (!pushSuportado) {
    notifEstado.textContent = 'Este navegador não recebe notificações. No iPhone, abra pelo app instalado na tela de início.';
    return;
  }
  if (Notification.permission === 'denied') {
    notifEstado.textContent = 'Notificações bloqueadas. Libere em Ajustes > Notificações > Controle.';
    return;
  }
  const inscricao = await inscricaoAtual();
  if (inscricao && Notification.permission === 'granted') {
    notifEstado.textContent = 'Ativadas neste aparelho. Avisa quando a cafeína do dia chega a 80% e a 100% do limite.';
    botaoNotifTeste.hidden = false;
    botaoNotifDesativar.hidden = false;
  } else {
    notifEstado.textContent = 'Desativadas neste aparelho.';
    botaoNotifAtivar.hidden = false;
  }
}

botaoNotifAtivar.addEventListener('click', async () => {
  botaoNotifAtivar.disabled = true;
  try {
    // A permissão precisa ser pedida direto no toque (o iPhone exige)
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') {
      await atualizarEstadoNotificacoes();
      return;
    }
    const resposta = await requisitar('GET', '/api/push/chave', null, 'Erro ao buscar a chave de notificação.');
    const { chave } = await resposta.json();
    if (!chave) throw new Error('O servidor ainda não tem as chaves de notificação.');
    const registro = await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveParaBytes(chave),
    });
    await requisitar('POST', '/api/push/inscricao', inscricao.toJSON(), 'Erro ao ativar as notificações.');
    mostrarNotificacao('Notificações ativadas');
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    botaoNotifAtivar.disabled = false;
    atualizarEstadoNotificacoes();
  }
});

botaoNotifTeste.addEventListener('click', async () => {
  botaoNotifTeste.disabled = true;
  try {
    await requisitar('POST', '/api/push/teste', null, 'Erro ao enviar o teste.');
    mostrarNotificacao('Teste enviado. Deve chegar em alguns segundos.');
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    botaoNotifTeste.disabled = false;
  }
});

botaoNotifDesativar.addEventListener('click', async () => {
  botaoNotifDesativar.disabled = true;
  try {
    const inscricao = await inscricaoAtual();
    if (inscricao) {
      await requisitar('POST', '/api/push/cancelar', { endpoint: inscricao.endpoint }, 'Erro ao desativar.');
      await inscricao.unsubscribe();
    }
    mostrarNotificacao('Notificações desativadas');
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    botaoNotifDesativar.disabled = false;
    atualizarEstadoNotificacoes();
  }
});

atualizarEstadoNotificacoes();

// ---------- Módulos ----------

// Cada módulo tem suas sub-abas na barra de baixo (botões com data-modulo
// igual ao id) e decide o que o "+" faz. Pra um módulo novo: as abas e seções
// dele no HTML, o código num arquivo próprio e uma entrada aqui.
const MODULOS = [
  {
    id: 'financas',
    nome: 'Finanças',
    icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1.5"/></svg>',
    abaInicial: abaVisaoGeral,
    ocultaValores: true, // tem o olho de esconder valores
    // Na aba Fatura o "+" lança uma compra no cartão; nas outras, um gasto
    aoAdicionar: () => {
      if (!secaoFatura.hidden && cartoes.length) abrirGavetaCompra();
      else abrirGaveta();
    },
  },
];

const botaoModulo = document.getElementById('botao-modulo');
const nomeModulo = document.getElementById('nome-modulo');
const menuModulos = document.getElementById('menu-modulos');

let moduloAtual = MODULOS[0];

// Pra módulos em outros arquivos (combustivel.js, ...) se cadastrarem
function registrarModulo(modulo) {
  MODULOS.push(modulo);
}

function fecharMenuModulos() {
  menuModulos.hidden = true;
  botaoModulo.setAttribute('aria-expanded', 'false');
}

function renderizarMenuModulos() {
  menuModulos.innerHTML = '';
  MODULOS.forEach((modulo) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'menu-modulo-item';
    item.classList.toggle('menu-modulo-ativo', modulo === moduloAtual);
    item.setAttribute('aria-current', String(modulo === moduloAtual));
    const icone = document.createElement('span');
    icone.className = 'menu-modulo-icone';
    icone.innerHTML = modulo.icone;
    const nome = document.createElement('span');
    nome.textContent = modulo.nome;
    item.append(icone, nome);
    item.addEventListener('click', () => {
      fecharMenuModulos();
      if (modulo !== moduloAtual) aplicarModulo(modulo, true);
    });
    menuModulos.appendChild(item);
  });
}

// abrir: vai pra aba inicial do módulo (na carga da página a aba já vem do HTML)
function aplicarModulo(modulo, abrir) {
  moduloAtual = modulo;
  try { localStorage.setItem('modulo', modulo.id); } catch (e) {}
  nomeModulo.textContent = modulo.nome;
  document.querySelectorAll('.abas [data-modulo]').forEach((aba) => {
    aba.hidden = aba.dataset.modulo !== modulo.id;
  });
  botaoAdicionar.hidden = !modulo.aoAdicionar;
  renderizarMenuModulos();
  aplicarOcultacao();
  if (abrir) selecionarAba(modulo.abaInicial);
}

const botaoOlho = document.getElementById('botao-olho');

// Liga ou desliga a ocultação conforme o olho e o módulo, e redesenha o que
// já estava na tela (as outras abas se redesenham ao serem abertas)
function aplicarOcultacao() {
  const antes = ocultarValoresAgora;
  ocultarValoresAgora = valoresOcultos && Boolean(moduloAtual.ocultaValores);

  botaoOlho.hidden = !moduloAtual.ocultaValores;
  botaoOlho.setAttribute('aria-pressed', String(valoresOcultos));
  const rotulo = valoresOcultos ? 'Mostrar valores' : 'Esconder valores';
  botaoOlho.setAttribute('aria-label', rotulo);
  botaoOlho.title = rotulo;
  botaoOlho.querySelector('.icone-olho-aberto').hidden = valoresOcultos;
  botaoOlho.querySelector('.icone-olho-fechado').hidden = !valoresOcultos;

  if (antes === ocultarValoresAgora || !moduloAtual.ocultaValores) return;
  if (carregouUmaVez) renderizarTudo();
  if (mesFatura) renderizarFatura();
}

botaoOlho.addEventListener('click', () => {
  valoresOcultos = !valoresOcultos;
  try { localStorage.setItem('valoresOcultos', valoresOcultos ? '1' : '0'); } catch (e) {}
  aplicarOcultacao();
});

botaoModulo.addEventListener('click', (evento) => {
  evento.stopPropagation();
  const vaiAbrir = menuModulos.hidden;
  fecharMultiSelects();
  menuModulos.hidden = !vaiAbrir;
  botaoModulo.setAttribute('aria-expanded', String(vaiAbrir));
});
menuModulos.addEventListener('click', (evento) => evento.stopPropagation());
document.addEventListener('click', fecharMenuModulos);
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharMenuModulos();
});

// Só depois de todos os scripts: os outros módulos precisam ter se cadastrado
// antes de restaurar o último módulo aberto
document.addEventListener('DOMContentLoaded', () => {
  let salvo = null;
  try { salvo = localStorage.getItem('modulo'); } catch (e) {}
  const modulo = MODULOS.find((m) => m.id === salvo) || MODULOS[0];
  aplicarModulo(modulo, modulo !== MODULOS[0]);
});

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
