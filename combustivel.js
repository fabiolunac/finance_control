/* ============================================================
   Controle Pessoal — módulo Combustível.
   Cada abastecimento guarda o km do parcial na hora de abastecer
   (antes de zerar): é quanto o veículo rodou com o abastecimento
   ANTERIOR. Juntando os dois, sai quanto cada abastecimento rendeu
   e o custo por km; com o preço por litro, os litros e o km/l.
   O mais recente fica "em uso" até o próximo.
   Usa do núcleo (script.js): registrarModulo, registrarAba,
   requisitar, mostrarNotificacao, removerComDesfazer e formatação.
   ============================================================ */

const abaCombustivel = document.getElementById('aba-combustivel');
const secaoCombustivel = document.getElementById('secao-combustivel');

const combustivelVeiculos = document.getElementById('combustivel-veiculos');
const combMediaRotulo = document.getElementById('comb-media-rotulo');
const combMediaKm = document.getElementById('comb-media-km');
const combMediaSub = document.getElementById('comb-media-sub');
const listaAbastecimentos = document.getElementById('lista-abastecimentos');
const abastecimentosVazio = document.getElementById('abastecimentos-vazio');

const gavetaAbastecimento = document.getElementById('gaveta-abastecimento');
const gavetaAbastTitulo = document.getElementById('gaveta-abast-titulo');
const formAbastecimento = document.getElementById('form-abastecimento');
const abastValor = document.getElementById('abast-valor');
const abastData = document.getElementById('abast-data');
const abastKm = document.getElementById('abast-km');
const abastCombustivel = document.getElementById('abast-combustivel');
const abastPreco = document.getElementById('abast-preco');
const abastVeiculo = document.getElementById('abast-veiculo');
const opcoesVeiculos = document.getElementById('opcoes-veiculos');
const abastPrevia = document.getElementById('abast-previa');
const botaoSalvarAbast = document.getElementById('botao-salvar-abast');
const botaoExcluirAbast = document.getElementById('botao-excluir-abast');
const erroAbast = document.getElementById('erro-abast');

let abastecimentos = [];
let veiculoFiltro = null; // null = todos
let abastecimentoEditando = null;
let precoDigitado = false; // mexeu no preço nesta abertura: não troca mais sozinho
const abastecimentosRemovendo = new Set();

async function carregarAbastecimentos() {
  erro.hidden = true;
  try {
    const resposta = await requisitar('GET', '/api/abastecimentos', null, 'Erro ao carregar os abastecimentos.');
    const dados = await resposta.json();
    abastecimentos = dados.abastecimentos.filter((a) => !abastecimentosRemovendo.has(a.id));
    renderizarCombustivel();
  } catch (e) {
    mostrarErro(e.message);
  }
}

// ---------- Contas ----------

function formatarKm(km) {
  return `${Math.round(km).toLocaleString('pt-BR')} km`;
}

const umaCasa = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Registros antigos, de antes do preço por litro, não têm litros
function litrosDe(abastecimento) {
  return abastecimento.PrecoLitro > 0 ? abastecimento.Valor / abastecimento.PrecoLitro : null;
}

// Último preço usado pra esse combustível: base quando esquecer de anotar
function ultimoPreco(combustivel) {
  const ultimo = abastecimentos
    .filter((a) => a.Combustivel === combustivel && a.PrecoLitro > 0)
    .sort((a, b) => b.Data.localeCompare(a.Data) || b.id - a.id)[0];
  return ultimo ? ultimo.PrecoLitro : null;
}

// Mais antigo primeiro, dentro de cada veículo
function ordenarCronologico(lista) {
  return [...lista].sort((a, b) => a.Data.localeCompare(b.Data) || a.id - b.id);
}

// id do abastecimento → { km, custoKm } com o que ele rendeu. O km vem do
// abastecimento seguinte do mesmo veículo; sem seguinte, km fica null (em uso)
function calcularRendimentos() {
  const porVeiculo = {};
  ordenarCronologico(abastecimentos).forEach((a) => {
    (porVeiculo[a.Veiculo] = porVeiculo[a.Veiculo] || []).push(a);
  });

  const rendimentos = new Map();
  Object.values(porVeiculo).forEach((lista) => {
    lista.forEach((a, i) => {
      const seguinte = lista[i + 1];
      const km = seguinte ? seguinte.Km : null;
      const litros = litrosDe(a);
      rendimentos.set(a.id, {
        km,
        custoKm: km > 0 ? a.Valor / km : null,
        kmPorLitro: km > 0 && litros ? km / litros : null,
      });
    });
  });
  return rendimentos;
}

// Abastecimento anterior do mesmo veículo, pela data (e id, no mesmo dia)
function abastecimentoAnterior(veiculo, data, idAtual) {
  return ordenarCronologico(abastecimentos)
    .filter((a) => a.Veiculo === veiculo && a.id !== idAtual &&
      (a.Data < data || (a.Data === data && idAtual != null && a.id < idAtual)))
    .pop() || null;
}

function veiculosCadastrados() {
  return [...new Set(abastecimentos.map((a) => a.Veiculo))].sort((a, b) => a.localeCompare(b));
}

// ---------- Tela ----------

function renderizarCombustivel() {
  const veiculos = veiculosCadastrados();
  if (veiculoFiltro && !veiculos.includes(veiculoFiltro)) veiculoFiltro = null;
  renderizarChipsVeiculos(veiculos);

  const lista = abastecimentos.filter((a) => !veiculoFiltro || a.Veiculo === veiculoFiltro);
  const rendimentos = calcularRendimentos();
  renderizarResumoCombustivel(lista, rendimentos);
  renderizarListaAbastecimentos(lista, rendimentos, veiculos.length > 1);
}

function renderizarChipsVeiculos(veiculos) {
  combustivelVeiculos.hidden = veiculos.length < 2;
  combustivelVeiculos.innerHTML = '';
  [null, ...veiculos].forEach((veiculo) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'botao-chip';
    chip.textContent = veiculo || 'Todos';
    chip.classList.toggle('botao-filtros-ativo', veiculo === veiculoFiltro);
    chip.setAttribute('aria-pressed', String(veiculo === veiculoFiltro));
    chip.addEventListener('click', () => {
      veiculoFiltro = veiculo;
      renderizarCombustivel();
    });
    combustivelVeiculos.appendChild(chip);
  });
}

// Média só dos abastecimentos já fechados (que têm o km do seguinte)
function renderizarResumoCombustivel(lista, rendimentos) {
  const fechados = lista.filter((a) => rendimentos.get(a.id).km > 0);
  combMediaRotulo.textContent = 'Consumo médio';
  if (!fechados.length) {
    combMediaKm.textContent = '—';
    combMediaSub.textContent = lista.length
      ? 'Aparece depois do segundo abastecimento do mesmo veículo'
      : '';
    return;
  }
  const kmTotal = fechados.reduce((soma, a) => soma + rendimentos.get(a.id).km, 0);
  const valorTotal = fechados.reduce((soma, a) => soma + a.Valor, 0);
  const textoFechados = `${fechados.length} ${fechados.length === 1 ? 'abastecimento fechado' : 'abastecimentos fechados'}`;

  // km/l só com os que têm preço por litro (os antigos podem não ter)
  const comLitros = fechados.filter((a) => litrosDe(a));
  if (comLitros.length) {
    const kmComLitros = comLitros.reduce((soma, a) => soma + rendimentos.get(a.id).km, 0);
    const litros = comLitros.reduce((soma, a) => soma + litrosDe(a), 0);
    combMediaKm.textContent = `${umaCasa(kmComLitros / litros)} km/l`;
    combMediaSub.textContent = `${formatarKm(kmTotal / fechados.length)} por abastecimento · ` +
      `${formatarMoeda(valorTotal / kmTotal)}/km · ${textoFechados}`;
    return;
  }
  combMediaRotulo.textContent = 'Cada abastecimento rende';
  combMediaKm.textContent = formatarKm(kmTotal / fechados.length);
  combMediaSub.textContent = `${formatarMoeda(valorTotal / kmTotal)}/km · ${textoFechados}`;
}

function renderizarListaAbastecimentos(lista, rendimentos, mostrarVeiculo) {
  listaAbastecimentos.innerHTML = '';
  abastecimentosVazio.hidden = lista.length > 0;

  lista.forEach((a) => {
    const { km, custoKm, kmPorLitro } = rendimentos.get(a.id);
    const litros = litrosDe(a);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'mini-lista-item';

    const textos = document.createElement('span');
    textos.className = 'parcela-textos';
    const titulo = document.createElement('span');
    titulo.className = 'parcela-descricao';
    titulo.textContent = `${formatarData(a.Data)} · ${a.Combustivel}`;
    const info = document.createElement('span');
    info.className = 'parcela-info';
    const partesInfo = [];
    if (mostrarVeiculo) partesInfo.push(a.Veiculo);
    if (litros) partesInfo.push(`${umaCasa(litros)} L a ${formatarMoeda(a.PrecoLitro)}`);
    else partesInfo.push(`parcial ${formatarKm(a.Km)}`);
    info.textContent = partesInfo.join(' · ');
    textos.append(titulo, info);

    const direita = document.createElement('span');
    direita.className = 'abast-direita';
    const valor = document.createElement('span');
    valor.className = 'mini-lista-valor';
    valor.textContent = formatarMoeda(a.Valor);
    const rendimento = document.createElement('span');
    rendimento.className = km > 0 ? 'abast-rendimento' : 'abast-rendimento abast-em-uso';
    rendimento.textContent = km > 0
      ? `${formatarKm(km)} · ${kmPorLitro ? `${umaCasa(kmPorLitro)} km/l` : `${formatarMoeda(custoKm)}/km`}`
      : 'em uso';
    direita.append(valor, rendimento);

    item.append(textos, direita);
    item.addEventListener('click', () => abrirGavetaAbastecimento(a));
    listaAbastecimentos.appendChild(item);
  });
}

// ---------- Gaveta de abastecimento ----------

function lerPreferencia(chave) {
  try { return localStorage.getItem(chave) || ''; } catch (e) { return ''; }
}

function salvarPreferencia(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch (e) {}
}

function abrirGavetaAbastecimento(abastecimento = null) {
  abastecimentoEditando = abastecimento;
  erroAbast.hidden = true;
  gavetaAbastTitulo.textContent = abastecimento ? 'Editar abastecimento' : 'Novo abastecimento';
  botaoSalvarAbast.textContent = abastecimento ? 'Salvar' : 'Adicionar';
  botaoExcluirAbast.hidden = !abastecimento;
  preencherDatalist(opcoesVeiculos, veiculosCadastrados());

  if (abastecimento) {
    abastValor.value = String(abastecimento.Valor).replace('.', ',');
    abastData.value = abastecimento.Data;
    abastKm.value = String(abastecimento.Km).replace('.', ',');
    abastCombustivel.value = abastecimento.Combustivel;
    abastVeiculo.value = abastecimento.Veiculo;
    abastPreco.value = abastecimento.PrecoLitro ? String(abastecimento.PrecoLitro).replace('.', ',') : '';
  } else {
    abastValor.value = '';
    abastData.value = formatarIso(new Date());
    abastKm.value = '';
    // Sugere o veículo e o combustível da última vez (ou o veículo filtrado)
    abastVeiculo.value = veiculoFiltro || lerPreferencia('ultimoVeiculo');
    abastCombustivel.value = lerPreferencia('ultimoCombustivel') || 'Gasolina';
    preencherPrecoBase();
  }
  precoDigitado = false;

  atualizarPreviaAbastecimento();
  gavetaAbastecimento.showModal();
  if (!abastecimento) abastValor.focus();
}

function preencherPrecoBase() {
  const preco = ultimoPreco(abastCombustivel.value);
  abastPreco.value = preco ? String(preco).replace('.', ',') : '';
}

// Litros deste abastecimento, e qual anterior esse km fecha e quanto ele rendeu
function atualizarPreviaAbastecimento() {
  const linhas = [];
  const valor = lerValor(abastValor.value);
  const preco = lerValor(abastPreco.value);
  if (valor > 0 && preco > 0) linhas.push(`≈ ${umaCasa(valor / preco)} litros`);

  const veiculo = abastVeiculo.value.trim();
  const km = lerValor(abastKm.value);
  if (veiculo && abastData.value) {
    const idAtual = abastecimentoEditando ? abastecimentoEditando.id : null;
    const anterior = abastecimentoAnterior(veiculo, abastData.value, idAtual);
    if (!anterior) {
      linhas.push(`Primeiro abastecimento do ${veiculo}: esse km não fecha nenhum anterior.`);
    } else {
      const inicio = `Fecha o de ${formatarData(anterior.Data).slice(0, 5)} (${formatarMoeda(anterior.Valor)})`;
      const litrosAnterior = litrosDe(anterior);
      let rendeu = '';
      if (km > 0) {
        rendeu = `: rodou ${formatarKm(km)} · ` +
          (litrosAnterior ? `${umaCasa(km / litrosAnterior)} km/l` : `${formatarMoeda(anterior.Valor / km)}/km`);
      }
      linhas.push(inicio + rendeu);
    }
  }
  abastPrevia.textContent = linhas.join('\n');
}

[abastValor, abastData, abastKm, abastVeiculo, abastPreco].forEach((campo) => {
  campo.addEventListener('input', atualizarPreviaAbastecimento);
});

abastPreco.addEventListener('input', () => { precoDigitado = true; });

// Trocou o combustível sem ter mexido no preço: vem o último preço do novo
abastCombustivel.addEventListener('change', () => {
  if (!abastecimentoEditando && !precoDigitado) preencherPrecoBase();
  atualizarPreviaAbastecimento();
});

async function salvarAbastecimento(evento) {
  evento.preventDefault();
  erroAbast.hidden = true;

  const abastecimento = {
    Data: abastData.value,
    Valor: lerValor(abastValor.value),
    Km: lerValor(abastKm.value),
    Combustivel: abastCombustivel.value,
    Veiculo: abastVeiculo.value.trim(),
    PrecoLitro: lerValor(abastPreco.value),
  };

  if (!(abastecimento.Valor > 0)) {
    erroAbast.textContent = 'Valor inválido. Use algo como 200,00.';
    erroAbast.hidden = false;
    return;
  }
  if (Number.isNaN(abastecimento.Km)) {
    erroAbast.textContent = 'Km inválido. Use o número do parcial, como 412 ou 412,5.';
    erroAbast.hidden = false;
    return;
  }
  if (!(abastecimento.PrecoLitro > 0)) {
    erroAbast.textContent = 'Preço por litro inválido. Use algo como 5,89.';
    erroAbast.hidden = false;
    return;
  }
  if (!abastecimento.Data || !abastecimento.Veiculo) return;

  const editando = abastecimentoEditando;
  botaoSalvarAbast.disabled = true;
  try {
    if (editando) {
      await requisitar('PUT', `/api/abastecimentos/${editando.id}`, abastecimento, 'Erro ao salvar o abastecimento.');
    } else {
      await requisitar('POST', '/api/abastecimentos', abastecimento, 'Erro ao gravar o abastecimento.');
    }
    salvarPreferencia('ultimoVeiculo', abastecimento.Veiculo);
    salvarPreferencia('ultimoCombustivel', abastecimento.Combustivel);
    gavetaAbastecimento.close();
    mostrarNotificacao(editando
      ? 'Abastecimento atualizado'
      : `Abastecimento de ${formatarMoeda(abastecimento.Valor)} registrado`);
    await carregarAbastecimentos();
  } catch (e) {
    erroAbast.textContent = e.message;
    erroAbast.hidden = false;
  } finally {
    botaoSalvarAbast.disabled = false;
  }
}

formAbastecimento.addEventListener('submit', salvarAbastecimento);
document.getElementById('botao-fechar-abast').addEventListener('click', () => gavetaAbastecimento.close());
gavetaAbastecimento.addEventListener('click', (evento) => {
  if (evento.target === gavetaAbastecimento) gavetaAbastecimento.close();
});

botaoExcluirAbast.addEventListener('click', () => {
  const abastecimento = abastecimentoEditando;
  gavetaAbastecimento.close();
  removerAbastecimento(abastecimento);
});

function removerAbastecimento(abastecimento) {
  erro.hidden = true;
  removerComDesfazer(`Abastecimento de ${formatarData(abastecimento.Data).slice(0, 5)} removido`, {
    tirar: () => {
      abastecimentosRemovendo.add(abastecimento.id);
      abastecimentos = abastecimentos.filter((a) => a.id !== abastecimento.id);
      renderizarCombustivel();
    },
    devolver: () => {
      abastecimentosRemovendo.delete(abastecimento.id);
      abastecimentos = [...abastecimentos, abastecimento]
        .sort((a, b) => b.Data.localeCompare(a.Data) || b.id - a.id);
      renderizarCombustivel();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/abastecimentos/${abastecimento.id}`, null, 'Erro ao remover o abastecimento.');
      } catch (e) {
        mostrarErro(e.message);
        abastecimentosRemovendo.delete(abastecimento.id);
        carregarAbastecimentos();
        return;
      }
      abastecimentosRemovendo.delete(abastecimento.id);
    },
  });
}

// ---------- Cadastro no núcleo ----------

registrarAba(abaCombustivel, secaoCombustivel, carregarAbastecimentos);

registrarModulo({
  id: 'combustivel',
  nome: 'Combustível',
  icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><line x1="2" y1="21" x2="16" y2="21"/><line x1="6" y1="8" x2="12" y2="8"/><path d="M15 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8.5L19 6"/></svg>',
  abaInicial: abaCombustivel,
  aoAdicionar: () => abrirGavetaAbastecimento(),
  aoAtualizar: carregarAbastecimentos,
});
