# Minha Lista 📋

Lista de tarefas que funciona **offline** e pode ser **instalada como aplicativo** (PWA).
Feita só com HTML, CSS e JavaScript — sem frameworks, sem servidor, sem banco de dados.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página do app |
| `style.css` | O visual |
| `script.js` | A lógica (tarefas salvas no `localStorage`) |
| `manifest.json` | Descreve o app pro navegador (nome, ícone, cores) |
| `sw.js` | Service Worker — faz o app funcionar offline |
| `icon-*.png` | Ícones do app (tela inicial do celular) |

## Como publicar no GitHub Pages

1. Crie um repositório novo no [github.com](https://github.com) (ex: `minha-lista`).
2. Envie **todos** os arquivos desta pasta (pode ser pelo botão *Add file → Upload files*).
3. No repositório, vá em **Settings → Pages**.
4. Em *Source*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` e clique em **Save**.
5. Aguarde 1–2 minutos. Seu app estará em:
   `https://SEU-USUARIO.github.io/minha-lista/`

## Como instalar como aplicativo

- **Android (Chrome):** abra o site → menu ⋮ → *Adicionar à tela inicial* (ou toque no botão "Instalar como aplicativo" que aparece na tela).
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*.
- **PC (Chrome/Edge):** ícone de instalar na barra de endereço.

Depois de instalado, o app abre em tela cheia, com ícone próprio, e funciona **sem internet**.

## Quando você atualizar o site

Sempre que mudar qualquer arquivo, abra o `sw.js` e aumente a versão na primeira linha:

```js
const VERSAO = 'minha-lista-v2'; // era v1
```

Isso avisa o navegador para baixar os arquivos novos em vez de usar os antigos do cache.

## Para testar no seu computador

O Service Worker não funciona abrindo o arquivo direto (`file://`).
Rode um servidor local na pasta:

```bash
# se tiver Python instalado:
python -m http.server 8000
```

E abra `http://localhost:8000` no navegador.
