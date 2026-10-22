/* ============================================================
   Controle Pessoal — aba Investimentos (dentro de Finanças).
   Cada aplicação rende um percentual do CDI, com uma taxa até um
   limite e outra acima dele (ex.: 120% até R$ 10 mil, 100% acima).
   Guarda o saldo conferido numa data; o saldo de hoje sai do CDI de
   cada dia útil depois dela, publicado pelo Banco Central (série 12
   do SGS, % ao dia). A tela mostra o líquido: IR regressivo e IOF
   estimados sobre o rendimento, como se resgatasse hoje.
   Usa do núcleo (script.js): requisitar, quandoAbrir, removerComDesfazer,
   mostrarNotificacao, animarValor, lerValor e formatação.
   ============================================================ */

const investTotal = document.getElementById('invest-total');
const investTotalSub = document.getElementById('invest-total-sub');
const investPorMes = document.getElementById('invest-por-mes');
const investPorDia = document.getElementById('invest-por-dia');
const investDataGeral = document.getElementById('invest-data-geral');
const investCdi = document.getElementById('invest-cdi');
const investDica = document.getElementById('invest-dica');
const investLista = document.getElementById('invest-lista');
const investVazio = document.getElementById('invest-vazio');

const gavetaAplicacao = document.getElementById('gaveta-aplicacao');
const gavetaAplicacaoTitulo = document.getElementById('gaveta-aplicacao-titulo');
const formAplicacao = document.getElementById('form-aplicacao');
const aplicacaoSaldo = document.getElementById('aplicacao-saldo');
const aplicacaoNome = document.getElementById('aplicacao-nome');
const aplicacaoData = document.getElementById('aplicacao-data');
const aplicacaoPercentual = document.getElementById('aplicacao-percentual');
const aplicacaoLimite = document.getElementById('aplicacao-limite');
const aplicacaoAcima = document.getElementById('aplicacao-acima');
const aplicacaoDesde = document.getElementById('aplicacao-desde');
const aplicacaoRendimentoAnterior = document.getElementById('aplicacao-rendimento-anterior');
const botaoSalvarAplicacao = document.getElementById('botao-salvar-aplicacao');
const botaoExcluirAplicacao = document.getElementById('botao-excluir-aplicacao');
const erroAplicacao = document.getElementById('erro-aplicacao');

const DIAS_UTEIS_MES = 21; // média, pra estimar quanto rende por mês

let aplicacoes = [];
let aplicacoesCarregadas = false;
let taxasCdi = []; // [{ data: 'YYYY-MM-DD', taxa: 0.050788 }] em % ao dia, do mais antigo pro mais novo
let cdiDesde = null; // primeira data já buscada no Banco Central
let aplicacaoEditando = null;

// ---------- CDI do Banco Central ----------

function isoParaBr(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Busca do dia seguinte à data mais antiga até hoje; só busca de novo se
// apareceu uma aplicação com data anterior ou mudou o dia
async function carregarCdi(desde) {
  const hoje = formatarIso(new Date());
  const chave = `${desde}|${hoje}`;
  if (cdiDesde === chave) return;
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json`
    + `&dataInicial=${isoParaBr(desde)}&dataFinal=${isoParaBr(hoje)}`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error('Não deu pra buscar o CDI no Banco Central.');
  const dados = await resposta.json();
  taxasCdi = dados.map(({ data, valor }) => {
    const [dia, mes, ano] = data.split('/');
    return { data: `${ano}-${mes}-${dia}`, taxa: Number(valor) };
  });
  cdiDesde = chave;
}

// ---------- Contas ----------

// Rendimento de um dia útil: a parte até o limite rende Percentual do CDI,
// o que passa rende PercentualAcima
function rendimentoDoDia(aplicacao, saldo, taxaDia) {
  const r = taxaDia / 100;
  if (!aplicacao.Limite) return saldo * r * aplicacao.Percentual / 100;
  const ate = Math.min(saldo, aplicacao.Limite);
  const acima = Math.max(saldo - aplicacao.Limite, 0);
  return ate * r * aplicacao.Percentual / 100 + acima * r * aplicacao.PercentualAcima / 100;
}

// IR da renda fixa: tabela regressiva pelos dias corridos aplicados
function aliquotaIr(dias) {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}

// IOF regressivo sobre o rendimento no resgate antes de 30 dias (Decreto 6.306/2007)
const TABELA_IOF = [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50,
  46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3];

function aliquotaIof(dias) {
  if (dias >= 30) return 0;
  return TABELA_IOF[Math.max(dias, 1) - 1] / 100;
}

function diasCorridos(desdeIso) {
  return Math.round((dataLocal(formatarIso(new Date())) - dataLocal(desdeIso)) / 86400000);
}

// Tudo em bruto e em líquido. O imposto é o do resgate hoje: IOF (até 30
// dias) e depois IR sobre o rendimento todo, o já embutido no saldo
// conferido mais o de depois. Projeções usam só o IR, o IOF acaba logo.
// Banco que mostra o saldo sem IR (SaldoLiquido): cada dia soma o
// rendimento já descontado, como o banco faz, e não há o que descontar.
function simular(aplicacao) {
  const mes = formatarIso(new Date()).slice(0, 7);
  const desde = aplicacao.AplicadoDesde || aplicacao.Data;
  const dias = diasCorridos(desde);
  const ir = aliquotaIr(dias);
  const ultima = taxasCdi.length ? taxasCdi[taxasCdi.length - 1].taxa : 0;

  let saldo = aplicacao.Saldo;
  let rendeuMes = 0;
  taxasCdi.forEach(({ data, taxa }) => {
    if (data <= aplicacao.Data) return;
    let ganho = rendimentoDoDia(aplicacao, saldo, taxa);
    if (aplicacao.SaldoLiquido) ganho *= 1 - aliquotaIr(diasCorridos(desde) - diasCorridos(data));
    saldo += ganho;
    if (data.startsWith(mes)) rendeuMes += ganho;
  });
  const porDia = rendimentoDoDia(aplicacao, saldo, ultima);
  const rendeu = saldo - aplicacao.Saldo;

  if (aplicacao.SaldoLiquido) {
    return {
      saldo,
      saldoLiquido: saldo,
      imposto: 0,
      aliquota: ir,
      dias,
      rendeu,
      rendeuLiquido: rendeu,
      rendeuMes,
      porDia: porDia * (1 - ir),
      porMes: porDia * DIAS_UTEIS_MES * (1 - ir),
      porMesBruto: porDia * DIAS_UTEIS_MES,
    };
  }

  const tributavel = rendeu + (aplicacao.RendimentoAnterior || 0);
  const iof = tributavel * aliquotaIof(dias);
  const impostoIr = (tributavel - iof) * ir;
  const liquido = 1 - ir;

  return {
    saldo,
    saldoLiquido: saldo - iof - impostoIr,
    imposto: iof + impostoIr,
    aliquota: ir,
    dias,
    rendeu,
    rendeuLiquido: rendeu * liquido,
    rendeuMes: rendeuMes * liquido,
    porDia: porDia * liquido,
    porMes: porDia * DIAS_UTEIS_MES * liquido,
    porMesBruto: porDia * DIAS_UTEIS_MES,
  };
}

function formatarPercentual(valor) {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

// CDI ao ano a partir da taxa diária (252 dias úteis)
function cdiAnual(taxaDia) {
  return ((1 + taxaDia / 100) ** 252 - 1) * 100;
}

// Dinheiro acima do limite rendendo menos, quando outra aplicação tem espaço
// a uma taxa melhor: sugere mover
function dicaDeMover(calculadas) {
  for (const origem of calculadas) {
    const { aplicacao, saldo } = origem;
    if (!aplicacao.Limite || saldo <= aplicacao.Limite) continue;
    const excesso = saldo - aplicacao.Limite;
    const destino = calculadas
      .filter((c) => c !== origem && c.aplicacao.Percentual > aplicacao.PercentualAcima
        && (!c.aplicacao.Limite || c.saldo < c.aplicacao.Limite))
      .sort((a, b) => b.aplicacao.Percentual - a.aplicacao.Percentual)[0];
    if (!destino) continue;
    const espaco = destino.aplicacao.Limite ? destino.aplicacao.Limite - destino.saldo : excesso;
    const mover = Math.min(excesso, espaco);
    return `${aplicacao.Nome} tem ${formatarMoeda(excesso)} acima do limite rendendo `
      + `${formatarPercentual(aplicacao.PercentualAcima)} do CDI. Dá pra mover ${formatarMoeda(mover)} `
      + `para ${destino.aplicacao.Nome}, a ${formatarPercentual(destino.aplicacao.Percentual)}.`;
  }
  return null;
}

// ---------- Tela ----------

function saldoBruto(aplicacao, calculadas) {
  return calculadas.find((c) => c.aplicacao === aplicacao).saldo;
}

function textoTaxa(aplicacao) {
  const base = `${formatarPercentual(aplicacao.Percentual)} do CDI`;
  if (!aplicacao.Limite) return base;
  return `${base} até ${formatarMoeda(aplicacao.Limite)} · ${formatarPercentual(aplicacao.PercentualAcima)} acima`;
}

function renderizarInvestimentos() {
  if (!aplicacoesCarregadas) return;
  investVazio.hidden = aplicacoes.length > 0;
  investLista.innerHTML = '';

  const calculadas = aplicacoes.map((aplicacao) => ({ aplicacao, ...simular(aplicacao) }));
  const soma = (campo) => calculadas.reduce((total, c) => total + c[campo], 0);

  animarValor(investTotal, soma('saldoLiquido'));
  animarValor(investPorMes, soma('porMes'));
  investTotalSub.textContent = [
    `bruto ${formatarMoeda(soma('saldo'))}`,
    `impostos ${formatarMoeda(soma('imposto'))}`,
    soma('rendeuMes') > 0 && `rendeu ${formatarMoeda(soma('rendeuMes'))} este mês`,
  ].filter(Boolean).join(' · ');
  investPorDia.textContent = `bruto ${formatarMoeda(soma('porMesBruto'))} · ${formatarMoeda(soma('porDia'))} por dia útil`;

  const ultima = taxasCdi[taxasCdi.length - 1];
  investCdi.textContent = ultima
    ? `CDI ${formatarPercentual(cdiAnual(ultima.taxa))} ao ano · Banco Central, ${formatarData(ultima.data)} · imposto estimado como se resgatasse hoje`
    : '';

  const dica = dicaDeMover(calculadas);
  investDica.hidden = !dica;
  investDica.textContent = dica || '';

  // A data do saldo vai numa linha só acima dos cards; o card só repete
  // a dele se for diferente da mais comum
  const contagem = {};
  aplicacoes.forEach((a) => { contagem[a.Data] = (contagem[a.Data] || 0) + 1; });
  const dataGeral = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a] || b.localeCompare(a))[0];
  investDataGeral.hidden = !dataGeral;
  if (dataGeral) {
    investDataGeral.textContent = `Saldos conferidos em ${formatarData(dataGeral)}, com o rendimento até hoje`;
  }

  calculadas.forEach(({ aplicacao, saldoLiquido, rendeuLiquido, porMes, imposto, aliquota, dias }) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'cartao-grafico metrica-extra invest-item';

    const nome = document.createElement('span');
    nome.className = 'metrica-rotulo';
    nome.textContent = aplicacao.Nome;
    const valor = document.createElement('span');
    valor.className = 'metrica-extra-valor';
    valor.textContent = formatarMoeda(saldoLiquido);
    const taxa = document.createElement('span');
    taxa.className = 'invest-taxa';
    taxa.textContent = textoTaxa(aplicacao);
    item.append(nome, valor, taxa);

    // Quanto do limite da taxa maior está ocupado
    if (aplicacao.Limite) {
      const trilha = document.createElement('div');
      trilha.className = 'progresso-trilha';
      const barra = document.createElement('div');
      // O limite vale sobre o saldo bruto
      const fracao = saldoBruto(aplicacao, calculadas) / aplicacao.Limite;
      barra.className = 'progresso-barra ' + (fracao > 1 ? 'progresso-alerta' : 'progresso-ok');
      barra.style.width = `${Math.min(fracao, 1) * 100}%`;
      trilha.appendChild(barra);
      item.appendChild(trilha);
    }

    // Rótulo à esquerda, valor à direita
    const dados = document.createElement('dl');
    dados.className = 'invest-dados';
    const linha = (rotulo, texto, classe) => {
      const dt = document.createElement('dt');
      dt.textContent = rotulo;
      const dd = document.createElement('dd');
      dd.textContent = texto;
      if (classe) dd.className = classe;
      dados.append(dt, dd);
    };
    linha('Rende por mês', `≈ ${formatarMoeda(porMes)}`, 'detalhe-bom');
    if (rendeuLiquido > 0) {
      const desde = aplicacao.Data === dataGeral ? 'Rendeu desde a conferência' : `Rendeu desde ${formatarData(aplicacao.Data).slice(0, 5)}`;
      linha(desde, `+${formatarMoeda(rendeuLiquido)}`);
    } else if (aplicacao.Data !== dataGeral) {
      linha('Saldo conferido em', formatarData(aplicacao.Data));
    }
    if (aplicacao.SaldoLiquido) linha(`IR ${formatarPercentual(aliquota * 100)}`, 'já descontado pelo banco');
    else linha(`Imposto (IR ${formatarPercentual(aliquota * 100)}${dias < 30 ? ' + IOF' : ''})`, formatarMoeda(imposto));
    if (aplicacao.Limite) {
      const livre = aplicacao.Limite - saldoBruto(aplicacao, calculadas);
      if (livre >= 0) linha('Livre no limite', formatarMoeda(livre));
      else linha('Acima do limite', formatarMoeda(-livre), 'detalhe-alerta');
    }
    item.appendChild(dados);

    item.addEventListener('click', () => abrirGavetaAplicacao(aplicacao));
    investLista.appendChild(item);
  });
}

async function carregarInvestimentos() {
  try {
    const resposta = await requisitar('GET', '/api/aplicacoes', null, 'Erro ao carregar as aplicações.');
    aplicacoes = (await resposta.json()).aplicacoes;
    aplicacoesCarregadas = true;
    // Sem aplicação, só os últimos dias, pra mostrar o CDI atual
    const datas = aplicacoes.map((a) => a.Data).sort();
    const semana = new Date();
    semana.setDate(semana.getDate() - 10);
    await carregarCdi(datas[0] || formatarIso(semana));
  } catch (e) {
    mostrarErro(e.message);
  }
  renderizarInvestimentos();
}

quandoAbrir(abaInvestimentos, carregarInvestimentos);

// ---------- Gaveta: nova aplicação e edição ----------

function textoNumero(valor) {
  return valor == null ? '' : String(valor).replace('.', ',');
}

function abrirGavetaAplicacao(aplicacao = null) {
  aplicacaoEditando = aplicacao;
  erroAplicacao.hidden = true;
  gavetaAplicacaoTitulo.textContent = aplicacao ? 'Editar aplicação' : 'Nova aplicação';
  botaoExcluirAplicacao.hidden = !aplicacao;
  aplicacaoSaldo.value = aplicacao ? textoNumero(aplicacao.Saldo) : '';
  aplicacaoNome.value = aplicacao ? aplicacao.Nome : '';
  aplicacaoData.value = aplicacao ? aplicacao.Data : formatarIso(new Date());
  aplicacaoPercentual.value = aplicacao ? textoNumero(aplicacao.Percentual) : '';
  aplicacaoLimite.value = aplicacao ? textoNumero(aplicacao.Limite) : '';
  aplicacaoAcima.value = aplicacao ? textoNumero(aplicacao.PercentualAcima) : '';
  aplicacaoDesde.value = aplicacao && aplicacao.AplicadoDesde ? aplicacao.AplicadoDesde : '';
  formAplicacao.elements['saldo-liquido'].value = aplicacao && aplicacao.SaldoLiquido ? '1' : '0';
  aplicacaoRendimentoAnterior.value = aplicacao && aplicacao.RendimentoAnterior ? textoNumero(aplicacao.RendimentoAnterior) : '';
  gavetaAplicacao.showModal();
  if (!aplicacao) aplicacaoSaldo.focus();
}

formAplicacao.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erroAplicacao.hidden = true;
  const limite = aplicacaoLimite.value.trim() ? lerValor(aplicacaoLimite.value) : null;
  const acima = aplicacaoAcima.value.trim() ? lerValor(aplicacaoAcima.value) : 100;
  const aplicacao = {
    Nome: aplicacaoNome.value.trim(),
    Saldo: lerValor(aplicacaoSaldo.value),
    Data: aplicacaoData.value,
    Percentual: lerValor(aplicacaoPercentual.value),
    Limite: limite,
    PercentualAcima: acima,
    AplicadoDesde: aplicacaoDesde.value || null,
    RendimentoAnterior: aplicacaoRendimentoAnterior.value.trim() ? lerValor(aplicacaoRendimentoAnterior.value) : 0,
    SaldoLiquido: formAplicacao.elements['saldo-liquido'].value === '1',
  };
  if ([aplicacao.Saldo, aplicacao.Percentual, acima, aplicacao.RendimentoAnterior].some(Number.isNaN) || (limite != null && !(limite > 0))) {
    erroAplicacao.textContent = 'Algum número está inválido. Use algo como 10000 ou 120,5.';
    erroAplicacao.hidden = false;
    return;
  }

  botaoSalvarAplicacao.disabled = true;
  try {
    if (aplicacaoEditando) {
      await requisitar('PUT', `/api/aplicacoes/${aplicacaoEditando.id}`, aplicacao, 'Erro ao salvar a aplicação.');
    } else {
      await requisitar('POST', '/api/aplicacoes', aplicacao, 'Erro ao salvar a aplicação.');
    }
    gavetaAplicacao.close();
    mostrarNotificacao(aplicacaoEditando ? 'Aplicação atualizada' : `Aplicação adicionada: ${aplicacao.Nome}`);
    await carregarInvestimentos();
  } catch (e) {
    erroAplicacao.textContent = e.message;
    erroAplicacao.hidden = false;
  } finally {
    botaoSalvarAplicacao.disabled = false;
  }
});

botaoExcluirAplicacao.addEventListener('click', () => {
  const aplicacao = aplicacaoEditando;
  if (!aplicacao) return;
  gavetaAplicacao.close();
  removerComDesfazer(`Aplicação removida: ${aplicacao.Nome}`, {
    tirar: () => {
      aplicacoes = aplicacoes.filter((a) => a.id !== aplicacao.id);
      renderizarInvestimentos();
    },
    devolver: () => {
      aplicacoes = [...aplicacoes, aplicacao].sort((a, b) => a.Nome.localeCompare(b.Nome));
      renderizarInvestimentos();
    },
    enviar: async () => {
      try {
        await requisitar('DELETE', `/api/aplicacoes/${aplicacao.id}`, null, 'Erro ao remover a aplicação.');
      } catch (e) {
        mostrarErro(e.message);
        await carregarInvestimentos();
      }
    },
  });
});

document.getElementById('botao-fechar-aplicacao').addEventListener('click', () => gavetaAplicacao.close());
gavetaAplicacao.addEventListener('click', (evento) => {
  if (evento.target === gavetaAplicacao) gavetaAplicacao.close();
});
