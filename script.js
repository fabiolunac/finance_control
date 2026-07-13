/* ============================================================
   Minha Lista — lógica do aplicativo
   As tarefas ficam salvas no localStorage do dispositivo,
   então funcionam mesmo sem internet.
   ============================================================ */

const campo = document.getElementById('campo-tarefa');
const botaoAdicionar = document.getElementById('botao-adicionar');
const lista = document.getElementById('lista');
const vazio = document.getElementById('vazio');
const statusRede = document.getElementById('status-rede');
const botaoInstalar = document.getElementById('botao-instalar');

// ---------- Estado ----------

let tarefas = carregar();

function carregar() {
  try {
    return JSON.parse(localStorage.getItem('tarefas')) || [];
  } catch {
    return [];
  }
}

function salvar() {
  localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// ---------- Renderização ----------

function renderizar() {
  lista.innerHTML = '';
  vazio.style.display = tarefas.length ? 'none' : 'block';

  tarefas.forEach((tarefa) => {
    const li = document.createElement('li');
    if (tarefa.feita) li.classList.add('feita');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = tarefa.feita;
    check.setAttribute('aria-label', 'Marcar como concluída');
    check.addEventListener('change', () => alternar(tarefa.id));

    const texto = document.createElement('span');
    texto.className = 'texto';
    texto.textContent = tarefa.texto;

    const remover = document.createElement('button');
    remover.className = 'remover';
    remover.textContent = '✕';
    remover.setAttribute('aria-label', 'Remover tarefa');
    remover.addEventListener('click', () => excluir(tarefa.id));

    li.append(check, texto, remover);
    lista.appendChild(li);
  });
}

// ---------- Ações ----------

function adicionar() {
  const texto = campo.value.trim();
  if (!texto) return;
  tarefas.unshift({ id: Date.now(), texto, feita: false });
  campo.value = '';
  campo.focus();
  salvar();
  renderizar();
}

function alternar(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) tarefa.feita = !tarefa.feita;
  salvar();
  renderizar();
}

function excluir(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  salvar();
  renderizar();
}

botaoAdicionar.addEventListener('click', adicionar);
campo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adicionar();
});

// ---------- Indicador online/offline ----------

function atualizarRede() {
  const online = navigator.onLine;
  statusRede.textContent = online ? 'online' : 'offline';
  statusRede.className = 'badge ' + (online ? 'badge-online' : 'badge-offline');
}

window.addEventListener('online', atualizarRede);
window.addEventListener('offline', atualizarRede);
atualizarRede();

// ---------- Botão "Instalar como aplicativo" ----------
// O navegador dispara 'beforeinstallprompt' quando o site
// cumpre os requisitos de PWA. Guardamos o evento e mostramos
// nosso próprio botão.

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

// Quando já estiver instalado, esconde o botão
window.addEventListener('appinstalled', () => {
  botaoInstalar.hidden = true;
});

// ---------- Início ----------

renderizar();
