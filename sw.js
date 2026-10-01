/* ============================================================
   Service Worker — é ele que faz o app funcionar offline.
   Estratégia: "network first" — tenta a rede e atualiza o
   cache; se estiver offline, responde com o cache.

   Com network first as atualizações do site aparecem sozinhas.
   A VERSAO só serve para limpar caches antigos na ativação.
   ============================================================ */

const VERSAO = 'controle-gastos-v66';

const ARQUIVOS = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/combustivel.js',
  './js/dieta.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

// Instalação: baixa e guarda todos os arquivos no cache
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

// Ativação: apaga caches de versões antigas
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== VERSAO)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

// Busca: tenta a rede e atualiza o cache; offline, usa o cache
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    fetch(evento.request)
      .then((respostaRede) => {
        // Só guarda respostas válidas do nosso próprio site
        if (respostaRede.ok && evento.request.url.startsWith(self.location.origin)) {
          const copia = respostaRede.clone();
          caches.open(VERSAO).then((cache) => cache.put(evento.request, copia));
        }
        return respostaRede;
      })
      .catch(() => caches.match(evento.request))
  );
});
