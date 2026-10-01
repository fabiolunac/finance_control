/* ============================================================
   Controle Pessoal — módulo Dieta.
   Comida: vazia por enquanto. Cafeína: bebidas cadastradas em
   Configurações (ml da unidade e mg de cafeína por ml) e o que foi
   tomado no dia. Cada consumo guarda cópia do nome, ml e mg, então
   mudar ou apagar uma bebida não mexe no histórico.
   Usa do núcleo (script.js): registrarModulo, registrarAba,
   quandoAbrir, requisitar, mostrarNotificacao, removerComDesfazer.
   ============================================================ */

// Limite diário escolhido (a FDA cita ~400 mg/dia como o que adultos saudáveis
// costumam tolerar). Não é recomendação médica; é a régua da barra e do gráfico.
const LIMITE_CAFEINA_MG = 500;

const abaDietaComida = document.getElementById('aba-dieta-comida');
const secaoDietaComida = document.getElementById('secao-dieta-comida');
const abaDietaCafeina = document.getElementById('aba-dieta-cafeina');
const secaoDietaCafeina = document.getElementById('secao-dieta-cafeina');

const cafeinaHojeTotal = document.getElementById('cafeina-hoje-total');
const cafeinaHojeSub = document.getElementById('cafeina-hoje-sub');
const cafeinaHojeBarra = document.getElementById('cafeina-hoje-barra');
const cafeinaHojeLista = document.getElementById('cafeina-hoje-lista');
const cafeinaRapidoBotoes = document.getElementById('cafeina-rapido-botoes');
const cafeinaSemBebida = document.getElementById('cafeina-sem-bebida');
const cafeinaGrafico = document.getElementById('cafeina-grafico');
const cafeinaMesNome = document.getElementById('cafeina-mes-nome');
const cafeinaMesResumo = document.getElementById('cafeina-mes-resumo');
const cafeinaDiaEscolhido = document.getElementById('cafeina-dia-escolhido');
const cafeinaDiaLista = document.getElementById('cafeina-dia-lista');

const gavetaCafeina = document.getElementById('gaveta-cafeina');
const gavetaCafeinaTitulo = document.getElementById('gaveta-cafeina-titulo');
const formCafeina = document.getElementById('form-cafeina');
const cafeinaBebida = document.getElementById('cafeina-bebida');
const cafeinaMl = document.getElementById('cafeina-ml');
const cafeinaQuando = document.getElementById('cafeina-quando');
const cafeinaPrevia = document.getElementById('cafeina-previa');
const botaoSalvarCafeina = document.getElementById('botao-salvar-cafeina');
const botaoExcluirCafeina = document.getElementById('botao-excluir-cafeina');
const erroCafeina = document.getElementById('erro-cafeina');

const listaBebidas = document.getElementById('lista-bebidas');
const formBebida = document.getElementById('form-bebida');

let bebidas = [];
let consumosCafeina = [];
let consumoEditando = null;
const consumosRemovendo = new Set();
const bebidasRemovendo = new Set();

async function carregarDieta() {
  erro.hidden = true;
  try {
    const [respostaBebidas, respostaConsumos] = await Promise.all([
      requisitar('GET', '/api/bebidas', null, 'Erro ao carregar as bebidas.'),
      requisitar('GET', '/api/cafeina', null, 'Erro ao carregar a cafeína.'),
    ]);
    bebidas = (await respostaBebidas.json()).bebidas.filter((b) => !bebidasRemovendo.has(b.id));
    consumosCafeina = (await respostaConsumos.json()).consumos.filter((c) => !consumosRemovendo.has(c.id));
    renderizarCafeina();
    renderizarBebidas();
  } catch (e) {
    mostrarErro(e.message);
  }
}

// ---------- Contas e formatação ----------

const mgDe = (bebida, ml) => ml * bebida.CafeinaPorMl;
const textoMg = (mg) => `${Math.round(mg).toLocaleString('pt-BR')} mg`;
const textoMl = (ml) => `${Math.round(ml).toLocaleString('pt-BR')} ml`;
const numeroParaCampo = (n) => String(n).replace('.', ',');

// "2026-09-30T14:05", no fuso local, como o input datetime-local usa
function agoraLocal() {
  const agora = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${formatarIso(agora)}T${p(agora.getHours())}:${p(agora.getMinutes())}`;
}

function consumosDeHoje() {
  const hoje = formatarIso(new Date());
  return consumosCafeina.filter((c) => c.DataHora.startsWith(hoje));
}

// ---------- Tela de cafeína ----------

function renderizarCafeina() {
  const hoje = consumosDeHoje();
  const total = hoje.reduce((soma, c) => soma + c.Cafeina, 0);

  cafeinaHojeTotal.textContent = textoMg(total);
  cafeinaHojeSub.textContent = `de ${textoMg(LIMITE_CAFEINA_MG)} de limite · ` +
    `${hoje.length} ${hoje.length === 1 ? 'bebida' : 'bebidas'}`;

  const fracao = total / LIMITE_CAFEINA_MG;
  cafeinaHojeBarra.style.width = `${Math.min(fracao, 1) * 100}%`;
  cafeinaHojeBarra.className = 'progresso-barra ' +
    (fracao >= 1 ? 'progresso-critico' : fracao >= 0.7 ? 'progresso-alerta' : 'progresso-ok');

  cafeinaHojeLista.innerHTML = '';
  hoje.forEach((consumo) => cafeinaHojeLista.appendChild(itemConsumo(consumo)));

  renderizarBotoesRapidos();
  renderizarGraficoCafeina();
}

// Linha de uma bebida (hora, ml e mg); tocar abre a gaveta pra editar
function itemConsumo(consumo) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'mini-lista-item';
  const textos = document.createElement('span');
  textos.className = 'parcela-textos';
  const nome = document.createElement('span');
  nome.className = 'parcela-descricao';
  nome.textContent = consumo.Bebida;
  const info = document.createElement('span');
  info.className = 'parcela-info';
  info.textContent = `${consumo.DataHora.slice(11, 16)} · ${textoMl(consumo.Ml)}`;
  textos.append(nome, info);
  const mg = document.createElement('span');
  mg.className = 'mini-lista-valor';
  mg.textContent = textoMg(consumo.Cafeina);
  item.append(textos, mg);
  item.addEventListener('click', () => abrirGavetaCafeina(consumo));
  return item;
}

// ---------- Gráfico de cafeína por dia ----------

let mesCafeina = mesAtual();
let diaCafeinaEscolhido = null; // dia do mês tocado no gráfico

// Colunas verticais (uma por dia) e uma linha tracejada na altura do limite
function renderizarGraficoCafeina() {
  const mes = mesCafeina;
  const [ano, m] = mes.split('-').map(Number);
  const nome = nomeMes(mes);
  cafeinaMesNome.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);

  const totais = {}; // dia do mês → mg
  consumosCafeina
    .filter((c) => c.DataHora.slice(0, 7) === mes)
    .forEach((c) => {
      const dia = Number(c.DataHora.slice(8, 10));
      totais[dia] = (totais[dia] || 0) + c.Cafeina;
    });

  // Escala com folga acima do maior valor, e nunca abaixo do limite (a linha sempre aparece)
  const maior = Math.max(0, ...Object.values(totais));
  const escala = Math.max(maior, LIMITE_CAFEINA_MG) * 1.1;
  const diasNoMes = new Date(ano, m, 0).getDate();
  const hoje = formatarIso(new Date());
  if (diaCafeinaEscolhido && !totais[diaCafeinaEscolhido]) diaCafeinaEscolhido = null;

  const area = document.createElement('div');
  area.className = 'cafeina-area';
  const linha = document.createElement('div');
  linha.className = 'cafeina-limite';
  linha.style.bottom = `${(LIMITE_CAFEINA_MG / escala) * 100}%`;
  const rotuloLinha = document.createElement('span');
  rotuloLinha.textContent = textoMg(LIMITE_CAFEINA_MG);
  linha.appendChild(rotuloLinha);
  area.appendChild(linha);

  const eixo = document.createElement('div');
  eixo.className = 'cafeina-eixo';

  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    const total = totais[dia] || 0;
    const iso = `${mes}-${String(dia).padStart(2, '0')}`;
    const coluna = document.createElement(total ? 'button' : 'div');
    coluna.className = 'cafeina-coluna';
    if (total) {
      coluna.type = 'button';
      coluna.title = `${formatarData(iso).slice(0, 5)}: ${textoMg(total)}`;
      coluna.setAttribute('aria-label', coluna.title);
      coluna.classList.toggle('cafeina-coluna-escolhida', dia === diaCafeinaEscolhido);
      coluna.addEventListener('click', () => {
        diaCafeinaEscolhido = diaCafeinaEscolhido === dia ? null : dia;
        renderizarGraficoCafeina();
      });
    }
    const barra = document.createElement('div');
    barra.className = 'cafeina-barra';
    barra.classList.toggle('cafeina-barra-acima', total > LIMITE_CAFEINA_MG);
    barra.style.height = `${(total / escala) * 100}%`;
    coluna.appendChild(barra);
    area.appendChild(coluna);

    // Número só no dia 1 e de 5 em 5, pra caber no celular; hoje sempre
    const marca = document.createElement('span');
    const ehHoje = iso === hoje;
    marca.textContent = dia === 1 || dia % 5 === 0 || ehHoje ? String(dia) : '';
    marca.classList.toggle('cafeina-eixo-hoje', ehHoje);
    eixo.appendChild(marca);
  }

  cafeinaGrafico.innerHTML = '';
  cafeinaGrafico.append(area, eixo);

  renderizarDiaCafeina(mes, totais);

  const dias = Object.keys(totais).length;
  if (!dias) {
    cafeinaMesResumo.textContent = 'Nenhum registro neste mês';
    return;
  }
  const soma = Object.values(totais).reduce((a, b) => a + b, 0);
  const acima = Object.values(totais).filter((t) => t > LIMITE_CAFEINA_MG).length;
  cafeinaMesResumo.textContent = `Média ${textoMg(soma / dias)} por dia com registro · ` +
    `${acima} ${acima === 1 ? 'dia' : 'dias'} acima de ${textoMg(LIMITE_CAFEINA_MG)}`;
}

// Dia tocado no gráfico: total e a lista das bebidas, igual à de hoje
function renderizarDiaCafeina(mes, totais) {
  cafeinaDiaLista.innerHTML = '';
  cafeinaDiaLista.hidden = !diaCafeinaEscolhido;
  if (!diaCafeinaEscolhido) {
    cafeinaDiaEscolhido.textContent = '';
    return;
  }

  const iso = `${mes}-${String(diaCafeinaEscolhido).padStart(2, '0')}`;
  const doDia = consumosCafeina
    .filter((c) => c.DataHora.startsWith(iso))
    .sort((a, b) => a.DataHora.localeCompare(b.DataHora));
  cafeinaDiaEscolhido.textContent = `${formatarData(iso).slice(0, 5)}: ${textoMg(totais[diaCafeinaEscolhido])} · ` +
    `${doDia.length} ${doDia.length === 1 ? 'bebida' : 'bebidas'}`;
  doDia.forEach((consumo) => cafeinaDiaLista.appendChild(itemConsumo(consumo)));
}

document.getElementById('cafeina-mes-anterior').addEventListener('click', () => {
  mesCafeina = somarMeses(mesCafeina, -1);
  diaCafeinaEscolhido = null;
  renderizarGraficoCafeina();
});

document.getElementById('cafeina-mes-proximo').addEventListener('click', () => {
  mesCafeina = somarMeses(mesCafeina, 1);
  diaCafeinaEscolhido = null;
  renderizarGraficoCafeina();
});

// Um botão por bebida: um toque registra uma unidade agora
function renderizarBotoesRapidos() {
  cafeinaSemBebida.hidden = bebidas.length > 0;
  cafeinaRapidoBotoes.innerHTML = '';
  bebidas.forEach((bebida) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'cafeina-rapido-botao';
    const nome = document.createElement('span');
    nome.className = 'cafeina-rapido-nome';
    nome.textContent = bebida.Nome;
    const info = document.createElement('span');
    info.className = 'cafeina-rapido-info';
    info.textContent = `${textoMl(bebida.Ml)} · ${textoMg(mgDe(bebida, bebida.Ml))}`;
    botao.append(nome, info);
    botao.addEventListener('click', () => registrarRapido(bebida, botao));
    cafeinaRapidoBotoes.appendChild(botao);
  });
}

async function registrarRapido(bebida, botao) {
  erro.hidden = true;
  botao.disabled = true;
  const consumo = {
    DataHora: agoraLocal(),
    BebidaId: bebida.id,
    Bebida: bebida.Nome,
    Ml: bebida.Ml,
    Cafeina: mgDe(bebida, bebida.Ml),
  };
  try {
    const resposta = await requisitar('POST', '/api/cafeina', consumo, 'Erro ao registrar a bebida.');
    const { id } = await resposta.json();
    mostrarNotificacao(`${bebida.Nome} registrado · ${textoMg(consumo.Cafeina)}`, 'Desfazer', async () => {
      try {
        await requisitar('DELETE', `/api/cafeina/${id}`, null, 'Erro ao desfazer.');
      } catch (e) {
        mostrarErro(e.message);
      }
      carregarDieta();
    }, 5000);
    await carregarDieta();
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    botao.disabled = false;
  }
}

document.getElementById('botao-ir-bebidas').addEventListener('click', irParaBebidas);

function irParaBebidas() {
  selecionarAba(abaConfiguracoes);
  document.getElementById('cartao-bebidas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Gaveta de consumo ----------

// Opções do select: as bebidas cadastradas e, ao editar um consumo cuja
// bebida foi apagada, uma opção com a cópia que ele guardou
function preencherOpcoesBebida(consumo) {
  cafeinaBebida.innerHTML = '';
  bebidas.forEach((bebida) => {
    const opcao = document.createElement('option');
    opcao.value = String(bebida.id);
    opcao.textContent = bebida.Nome;
    cafeinaBebida.appendChild(opcao);
  });
  if (consumo && !bebidas.some((b) => b.id === consumo.BebidaId)) {
    const opcao = document.createElement('option');
    opcao.value = 'copia';
    opcao.textContent = `${consumo.Bebida} (removida)`;
    cafeinaBebida.appendChild(opcao);
  }
}

// Bebida escolhida, com o mg/ml; na opção "copia", o mg/ml sai do consumo
function bebidaEscolhida() {
  if (cafeinaBebida.value === 'copia' && consumoEditando) {
    return {
      id: null,
      Nome: consumoEditando.Bebida,
      Ml: consumoEditando.Ml,
      CafeinaPorMl: consumoEditando.Ml > 0 ? consumoEditando.Cafeina / consumoEditando.Ml : 0,
    };
  }
  return bebidas.find((b) => String(b.id) === cafeinaBebida.value) || null;
}

function abrirGavetaCafeina(consumo = null) {
  consumoEditando = consumo;
  erroCafeina.hidden = true;
  gavetaCafeinaTitulo.textContent = consumo ? 'Editar consumo' : 'Registrar cafeína';
  botaoSalvarCafeina.textContent = consumo ? 'Salvar' : 'Registrar';
  botaoExcluirCafeina.hidden = !consumo;
  preencherOpcoesBebida(consumo);

  if (consumo) {
    cafeinaBebida.value = bebidas.some((b) => b.id === consumo.BebidaId) ? String(consumo.BebidaId) : 'copia';
    cafeinaMl.value = numeroParaCampo(consumo.Ml);
    cafeinaQuando.value = consumo.DataHora;
  } else {
    const bebida = bebidaEscolhida();
    cafeinaMl.value = bebida ? numeroParaCampo(bebida.Ml) : '';
    cafeinaQuando.value = agoraLocal();
  }

  atualizarPreviaCafeina();
  gavetaCafeina.showModal();
}

function atualizarPreviaCafeina() {
  const bebida = bebidaEscolhida();
  const ml = lerValor(cafeinaMl.value);
  cafeinaPrevia.textContent = bebida && ml > 0 ? `${textoMg(mgDe(bebida, ml))} de cafeína` : '';
}

// Trocou a bebida: a quantidade vira a unidade dela
cafeinaBebida.addEventListener('change', () => {
  const bebida = bebidaEscolhida();
  if (bebida) cafeinaMl.value = numeroParaCampo(bebida.Ml);
  atualizarPreviaCafeina();
});
cafeinaMl.addEventListener('input', atualizarPreviaCafeina);

async function salvarConsumo(evento) {
  evento.preventDefault();
  erroCafeina.hidden = true;

  const bebida = bebidaEscolhida();
  const ml = lerValor(cafeinaMl.value);
  if (!bebida) return;
  if (!(ml > 0)) {
    erroCafeina.textContent = 'Quantidade inválida. Use os ml, como 473.';
    erroCafeina.hidden = false;
    return;
  }
  if (!cafeinaQuando.value) return;

  const consumo = {
    DataHora: cafeinaQuando.value.slice(0, 16),
    BebidaId: bebida.id,
    Bebida: bebida.Nome,
    Ml: ml,
    Cafeina: mgDe(bebida, ml),
  };

  const editando = consumoEditando;
  botaoSalvarCafeina.disabled = true;
  try {
    if (editando) {
      await requisitar('PUT', `/api/cafeina/${editando.id}`, consumo, 'Erro ao salvar.');
    } else {
      await requisitar('POST', '/api/cafeina', consumo, 'Erro ao registrar.');
    }
    gavetaCafeina.close();
    mostrarNotificacao(editando ? 'Consumo atualizado' : `${bebida.Nome} registrado · ${textoMg(consumo.Cafeina)}`);
    await carregarDieta();
  } catch (e) {
    erroCafeina.textContent = e.message;
    erroCafeina.hidden = false;
  } finally {
    botaoSalvarCafeina.disabled = false;
  }
}

formCafeina.addEventListener('submit', salvarConsumo);
document.getElementById('botao-fechar-cafeina').addEventListener('click', () => gavetaCafeina.close());
gavetaCafeina.addEventListener('click', (evento) => {
  if (evento.target === gavetaCafeina) gavetaCafeina.close();
});

botaoExcluirCafeina.addEventListener('click', () => {
  const consumo = consumoEditando;
  gavetaCafeina.close();
  removerComDesfazer(`${consumo.Bebida} removido`, {
    tirar: () => {
      consumosRemovendo.add(consumo.id);
      consumosCafeina = consumosCafeina.filter((c) => c.id !== consumo.id);
      renderizarCafeina();
    },
    devolver: () => {
      consumosRemovendo.delete(consumo.id);
      consumosCafeina = [...consumosCafeina, consumo]
        .sort((a, b) => b.DataHora.localeCompare(a.DataHora) || b.id - a.id);
      renderizarCafeina();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/cafeina/${consumo.id}`, null, 'Erro ao remover.');
        consumosRemovendo.delete(consumo.id);
      } catch (e) {
        // Não saiu do servidor: tira da lista de removendo antes de recarregar
        consumosRemovendo.delete(consumo.id);
        mostrarErro(e.message);
        carregarDieta();
      }
    },
  });
});

// ---------- Bebidas (em Configurações) ----------

function lerCamposBebida(nome, ml, mg) {
  return { Nome: nome.value.trim(), Ml: lerValor(ml.value), CafeinaPorMl: lerValor(mg.value) };
}

function bebidaValida(bebida) {
  return bebida.Nome && bebida.Ml > 0 && bebida.CafeinaPorMl >= 0;
}

function criarCampoBebida(valor, rotulo, texto) {
  const campo = document.createElement('input');
  campo.type = 'text';
  campo.required = true;
  campo.autocomplete = 'off';
  campo.value = valor;
  campo.setAttribute('aria-label', rotulo);
  if (!texto) campo.inputMode = 'decimal';
  return campo;
}

function renderizarBebidas() {
  listaBebidas.innerHTML = '';
  bebidas.forEach((bebida) => {
    const form = document.createElement('form');
    form.className = 'pendente';

    const info = document.createElement('div');
    info.className = 'pendente-info';
    const nome = document.createElement('span');
    nome.className = 'pendente-local';
    nome.textContent = `${bebida.Nome} · ${textoMg(mgDe(bebida, bebida.Ml))} por unidade`;
    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'botao-remover';
    remover.textContent = '×';
    remover.setAttribute('aria-label', `Remover ${bebida.Nome}`);
    remover.addEventListener('click', () => removerBebida(bebida));
    info.append(nome, remover);

    const campoNome = criarCampoBebida(bebida.Nome, 'Nome da bebida', true);
    const campoMl = criarCampoBebida(numeroParaCampo(bebida.Ml), 'Ml de uma unidade');
    const campoMg = criarCampoBebida(numeroParaCampo(bebida.CafeinaPorMl), 'Cafeína em mg por ml');
    const salvar = document.createElement('button');
    salvar.type = 'submit';
    salvar.className = 'botao-primario';
    salvar.textContent = 'Salvar';

    const campos = document.createElement('div');
    campos.className = 'cartao-campos';
    campos.append(campoNome, campoMl, campoMg, salvar);
    form.append(info, campos);

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const dados = lerCamposBebida(campoNome, campoMl, campoMg);
      if (!bebidaValida(dados)) {
        mostrarErro('Confira a bebida: ml maior que zero e mg/ml como 0,338.');
        return;
      }
      salvar.disabled = true;
      try {
        await requisitar('PUT', `/api/bebidas/${bebida.id}`, dados, 'Erro ao salvar a bebida.');
        mostrarNotificacao('Bebida atualizada');
        await carregarDieta();
      } catch (e) {
        mostrarErro(e.message);
      } finally {
        salvar.disabled = false;
      }
    });

    listaBebidas.appendChild(form);
  });
}

formBebida.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const dados = lerCamposBebida(
    document.getElementById('bebida-nome'),
    document.getElementById('bebida-ml'),
    document.getElementById('bebida-mg'));
  if (!bebidaValida(dados)) {
    mostrarErro('Confira a bebida: ml maior que zero e mg/ml como 0,338.');
    return;
  }
  erro.hidden = true;
  try {
    await requisitar('POST', '/api/bebidas', dados, 'Erro ao gravar a bebida.');
    formBebida.reset();
    mostrarNotificacao(`${dados.Nome} adicionada · ${textoMg(mgDe(dados, dados.Ml))} por unidade`);
    await carregarDieta();
  } catch (e) {
    mostrarErro(e.message);
  }
});

function removerBebida(bebida) {
  erro.hidden = true;
  removerComDesfazer(`${bebida.Nome} removida`, {
    tirar: () => {
      bebidasRemovendo.add(bebida.id);
      bebidas = bebidas.filter((b) => b.id !== bebida.id);
      renderizarBebidas();
      renderizarCafeina();
    },
    devolver: () => {
      bebidasRemovendo.delete(bebida.id);
      bebidas = [...bebidas, bebida].sort((a, b) => a.Nome.localeCompare(b.Nome));
      renderizarBebidas();
      renderizarCafeina();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/bebidas/${bebida.id}`, null, 'Erro ao remover a bebida.');
        bebidasRemovendo.delete(bebida.id);
      } catch (e) {
        bebidasRemovendo.delete(bebida.id);
        mostrarErro(e.message);
        carregarDieta();
      }
    },
  });
}

// ---------- Cadastro no núcleo ----------

registrarAba(abaDietaComida, secaoDietaComida);
registrarAba(abaDietaCafeina, secaoDietaCafeina, carregarDieta);
quandoAbrir(abaConfiguracoes, carregarDieta);

registrarModulo({
  id: 'dieta',
  nome: 'Dieta',
  icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c-2.5-2-6-1.5-7 1.5-1.2 3.6 1 9.5 4 11 1.2.6 2 .2 3-.3 1 .5 1.8.9 3 .3 3-1.5 5.2-7.4 4-11-1-3-4.5-3.5-7-1.5z"/><path d="M12 7c0-2 1-3.5 3-4"/></svg>',
  abaInicial: abaDietaCafeina,
  // Sem bebida cadastrada, o "+" leva pro cadastro
  aoAdicionar: () => {
    if (bebidas.length) abrirGavetaCafeina();
    else irParaBebidas();
  },
  aoAtualizar: carregarDieta,
});
