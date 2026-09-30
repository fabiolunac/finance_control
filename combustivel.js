/* ============================================================
   Controle Pessoal — módulo Combustível.
   Por enquanto só se cadastra e mostra a tela vazia; os
   abastecimentos entram aqui aos poucos.
   Usa do núcleo (script.js): registrarModulo, registrarAba.
   ============================================================ */

const abaCombustivel = document.getElementById('aba-combustivel');
const secaoCombustivel = document.getElementById('secao-combustivel');

registrarAba(abaCombustivel, secaoCombustivel);

registrarModulo({
  id: 'combustivel',
  nome: 'Combustível',
  icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><line x1="2" y1="21" x2="16" y2="21"/><line x1="6" y1="8" x2="12" y2="8"/><path d="M15 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8.5L19 6"/></svg>',
  abaInicial: abaCombustivel,
  // Sem aoAdicionar: o "+" fica escondido neste módulo até existir o que lançar
});
