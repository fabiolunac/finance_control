/* ============================================================
   Service Worker — é ele que faz o app funcionar offline.
   Estratégia: "cache first" — tenta o cache, se não tiver
   busca na rede e guarda pra próxima vez.

   IMPORTANTE: sempre que você mudar o site, aumente a VERSAO
   abaixo (v1 → v2 → v3...). Isso força o navegador a baixar
   os arquivos novos em vez de usar os antigos do cache.
   ============================================================ */

const VERSAO = 'controle-gastos-v17';

const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
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

// Busca: responde do cache; se não tiver, vai à rede e guarda
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then((resposta) => {
      if (resposta) return resposta;

      return fetch(evento.request).then((respostaRede) => {
        // Só guarda respostas válidas do nosso próprio site
        if (respostaRede.ok && evento.request.url.startsWith(self.location.origin)) {
          const copia = respostaRede.clone();
          caches.open(VERSAO).then((cache) => cache.put(evento.request, copia));
        }
        return respostaRede;
      });
    })
  );
});
