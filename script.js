/* ============================================================
   Controle de Gastos — lógica do aplicativo
   Os dados ficam num backend (API + banco na nuvem), sincronizados
   entre dispositivos. Precisa de rede para ler/gravar.
   ============================================================ */

// Preencha com a URL do seu backend depois do deploy (ver README.md)
const API_URL = 'https://SEU-BACKEND.onrender.com';

const statusRede = document.getElementById('status-rede');
const botaoInstalar = document.getElementById('botao-instalar');

const campoMes = document.getElementById('campo-mes');
const mesAnterior = document.getElementById('mes-anterior');
const mesSeguinte = document.getElementById('mes-seguinte');
const valorTotal = document.getElementById('valor-total');

const formGasto = document.getElementById('form-gasto');
const campoData = document.getElementById('campo-data');
const campoLocal = document.getElementById('campo-local');
const campoValor = document.getElementById('campo-valor');
const botaoAdicionar = document.getElementById('botao-adicionar');

const lista = document.getElementById('lista');
const vazio = document.getElementById('vazio');
const erro = document.getElementById('erro');

// ---------- Token de acesso ----------

function obterToken() {
  let token = localStorage.getItem('apiToken');
  if (!token) {
    token = prompt('Código de acesso do app:');
    if (token) localStorage.setItem('apiToken', token);
  }
  return token;
}

async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${obterToken()}`,
      ...(opcoes.headers || {}),
    },
  });

  if (resposta.status === 401) {
    localStorage.removeItem('apiToken');
    throw new Error('Código de acesso inválido.');
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || 'Erro ao falar com o servidor.');
  }
  return resposta.json();
}

// ---------- Estado ----------

function mesFormatado(data) {
  return data.toISOString().slice(0, 7); // YYYY-MM
}

let mesSelecionado = mesFormatado(new Date());

// ---------- Renderização ----------

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function renderizar(gastos, total) {
  lista.innerHTML = '';
  vazio.style.display = gastos.length ? 'none' : 'block';
  valorTotal.textContent = formatarMoeda(total);

  gastos.forEach((gasto) => {
    const li = document.createElement('li');

    const info = document.createElement('div');
    info.className = 'gasto-info';

    const local = document.createElement('span');
    local.className = 'gasto-local';
    local.textContent = gasto.Local;

    const data = document.createElement('span');
    data.className = 'gasto-data';
    data.textContent = formatarData(gasto.Data);

    info.append(local, data);

    const valor = document.createElement('span');
    valor.className = 'gasto-valor';
    valor.textContent = formatarMoeda(gasto.Valor);

    const remover = document.createElement('button');
    remover.className = 'remover';
    remover.textContent = '✕';
    remover.setAttribute('aria-label', 'Remover gasto');
    remover.addEventListener('click', () => excluir(gasto.rowid));

    li.append(info, valor, remover);
    lista.appendChild(li);
  });
}

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.hidden = !mensagem;
}

// ---------- Ações ----------

async function carregar() {
  mostrarErro('');
  try {
    const dados = await chamarApi(`/api/gastos?mes=${mesSelecionado}`);
    renderizar(dados.gastos, dados.total);
  } catch (e) {
    mostrarErro(e.message);
  }
}

async function adicionar(evento) {
  evento.preventDefault();
  const Data = campoData.value;
  const Local = campoLocal.value.trim();
  const Valor = parseFloat(campoValor.value);

  if (!Data || !Local || Number.isNaN(Valor)) return;

  mostrarErro('');
  try {
    await chamarApi('/api/gastos', {
      method: 'POST',
      body: JSON.stringify({ Data, Local, Valor }),
    });
    campoLocal.value = '';
    campoValor.value = '';
    campoLocal.focus();

    const mesDoLancamento = Data.slice(0, 7);
    if (mesDoLancamento === mesSelecionado) {
      await carregar();
    }
  } catch (e) {
    mostrarErro(e.message);
  }
}

async function excluir(rowid) {
  mostrarErro('');
  try {
    await chamarApi(`/api/gastos/${rowid}`, { method: 'DELETE' });
    await carregar();
  } catch (e) {
    mostrarErro(e.message);
  }
}

// ---------- Seletor de mês ----------

function irParaMes(delta) {
  const [ano, mes] = mesSelecionado.split('-').map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  mesSelecionado = mesFormatado(data);
  campoMes.value = mesSelecionado;
  carregar();
}

campoMes.addEventListener('change', () => {
  if (campoMes.value) {
    mesSelecionado = campoMes.value;
    carregar();
  }
});

mesAnterior.addEventListener('click', () => irParaMes(-1));
mesSeguinte.addEventListener('click', () => irParaMes(1));

formGasto.addEventListener('submit', adicionar);

// ---------- Indicador online/offline ----------

function atualizarRede() {
  const online = navigator.onLine;
  statusRede.textContent = online ? 'online' : 'offline';
  statusRede.className = 'badge ' + (online ? 'badge-online' : 'badge-offline');
  botaoAdicionar.disabled = !online;
  if (!online) mostrarErro('Sem conexão — não é possível ler ou gravar gastos agora.');
}

window.addEventListener('online', () => { atualizarRede(); carregar(); });
window.addEventListener('offline', atualizarRede);

// ---------- Botão "Instalar como aplicativo" ----------

let eventoInstalacao = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalacao = e;
  botaoInstalar.hidden = false;
});

botaoInstalar.addEventListener('click', async () => {
  if (!eventoInstalacao) return;
  eventoInstalacao.prompt();
  await eventoInstalacao.userChoice;
  eventoInstalacao = null;
  botaoInstalar.hidden = true;
});

window.addEventListener('appinstalled', () => {
  botaoInstalar.hidden = true;
});

// ---------- Início ----------

campoData.value = new Date().toISOString().slice(0, 10);
campoMes.value = mesSelecionado;
atualizarRede();
if (navigator.onLine) carregar();
