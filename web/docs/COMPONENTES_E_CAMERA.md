# Documentação de Componentes e Módulo de Câmera

Este documento descreve o funcionamento atual dos componentes do frontend (`web/`) e do módulo de câmera.

## 1) Visão geral da aplicação web

O frontend está em Next.js com App Router, com a seguinte composição principal:

1. `app/layout.tsx` define metadados, fontes globais e estrutura de página.
2. `app/page.tsx` monta a Home com os componentes visuais.
3. Componentes de UI em `app/components/*`.
4. Lógica de câmera separada em:
   - `app/lib/camera/requestCameraPermission.ts` (acesso ao navegador)
   - `app/hooks/useCameraPermission.ts` (estado e ciclo de vida no React)

## 2) Fluxo de renderização da Home

Arquivo: `app/page.tsx`

Ordem dos componentes renderizados:

1. `Header`
2. `Hero`
3. `Features`
4. `Footer`

O `main` usa `min-h-screen`, garantindo altura mínima de tela.

## 3) Componentes detalhados

### 3.1 `app/layout.tsx` (RootLayout)

Responsabilidades:

- Configura os metadados globais da aplicação (`title` e `description`).
- Carrega as fontes `Geist` e `Geist_Mono` via `next/font/google`.
- Define o HTML raiz com classes utilitárias de altura total e antialias.
- Define `body` com layout flex para ocupar toda a altura.

Impacto funcional:

- Todos os componentes da aplicação são renderizados dentro de `children`.
- As variáveis CSS de fonte ficam disponíveis globalmente.

### 3.2 `app/components/Header.tsx`

Responsabilidades:

- Exibir cabeçalho fixo no topo (`fixed top-0`).
- Mostrar marca `LibrasQuest`.
- Exibir navegação inicial (atualmente com o link "Sobre").

Comportamento:

- Header permanece visível durante o scroll por usar posição fixa e `z-50`.
- Fundo semitransparente com blur para legibilidade sobre o Hero.

### 3.3 `app/components/Hero.tsx`

> Componente **client-side** (`'use client'`) porque depende de APIs do navegador e estado React.

Responsabilidades:

- Renderizar CTA principal da landing.
- Disparar teste de câmera quando o usuário clica no botão.
- Exibir preview de vídeo após permissão concedida.
- Permitir interrupção manual do teste.

Estados/ações consumidos do hook `useCameraPermission()`:

- `status`: estado atual da permissão (`granted`, `denied`, `unsupported`, `error` ou `null`).
- `isLoading`: estado de carregamento durante solicitação de permissão.
- `error`: mensagem de erro amigável.
- `stream`: `MediaStream` ativo da câmera.
- `requestPermission()`: inicia solicitação de permissão.
- `stopCameraTest()`: interrompe stream e limpa o estado.

Detalhes de funcionamento:

1. `handleCameraTest` chama `requestPermission()`.
2. Se o resultado for `denied`, `unsupported` ou `error`, exibe `alert` correspondente.
3. Quando `status === 'granted'` e há `stream`:
   - renderiza um `video` para preview;
   - renderiza o botão **"Interromper teste"** logo abaixo do preview.
4. Ao clicar em **"Interromper teste"**, `stopCameraTest()` é executado e:
   - o stream é encerrado;
   - o preview some;
   - o botão de interrupção também some.

Integração do vídeo (`useEffect` + `ref`):

- `videoRef.current.srcObject = stream` quando há stream.
- `videoRef.current.play()` é chamado em tentativa de autoplay.
- Quando stream fica `null`, `srcObject` é limpo.

### 3.4 `app/components/Features.tsx`

Responsabilidades:

- Exibir seção de funcionalidades com foco em:
  - reconhecimento;
  - gamificação.

Comportamento:

- Layout responsivo com coluna no mobile e linha no desktop.
- Usa `next/image` para otimizar a imagem `/public/hand.PNG`.

### 3.5 `app/components/Footer.tsx`

Responsabilidades:

- Renderizar rodapé com direitos autorais.
- Exibir ano dinâmico com `new Date().getFullYear()`.

Comportamento:

- Estrutura simples e estática de encerramento da página.

## 4) Estilo global

Arquivo: `app/globals.css`

Responsabilidades:

- Importar fonte `Press Start 2P`.
- Carregar Tailwind CSS (`@import "tailwindcss"`).
- Definir tema com variáveis (`--color-bg-dark`, `--color-primary-cyan`, etc.).
- Configurar estilo base de `body`.
- Definir classe utilitária `.pixel-title` para estética retrô.

Observação importante de ordem:

- O `@import` da fonte deve ficar antes do `@import "tailwindcss"`.

## 5) Módulo da câmera (detalhamento completo)

### 5.1 `app/lib/camera/requestCameraPermission.ts`

Camada de acesso ao navegador e normalização de retorno.

Tipos exportados:

- `CameraPermissionStatus = 'granted' | 'denied' | 'unsupported' | 'error'`
- `CameraPermissionResult = { status: CameraPermissionStatus; stream: MediaStream | null }`

Função principal:

- `requestCameraPermission(): Promise<CameraPermissionResult>`

Fluxo interno:

1. Verifica suporte à API `navigator.mediaDevices.getUserMedia`.
2. Se não houver suporte:
   - retorna `{ status: 'unsupported', stream: null }`.
3. Se houver suporte, tenta `getUserMedia({ video: true })`.
4. Se sucesso:
   - retorna `{ status: 'granted', stream }`.
5. Se falha:
   - `NotAllowedError` → `denied`
   - `NotFoundError` → `unsupported`
   - demais erros → `error` (com log em `console.error`)

### 5.2 `app/hooks/useCameraPermission.ts`

Camada de estado React e ciclo de vida do stream.

Estado interno:

- `status: CameraPermissionStatus | null`
- `isLoading: boolean`
- `error: string | null`
- `stream: MediaStream | null`

Funções internas:

- `stopMediaStream(stream)`:
  - encerra todas as tracks com `track.stop()`.

Efeito de cleanup:

- `useEffect` de retorno encerra stream ativo no unmount ou troca de stream.

API pública do hook:

- `requestPermission(): Promise<CameraPermissionStatus>`
  1. Ativa loading e limpa erro.
  2. Encerra stream anterior, se existir.
  3. Chama `requestCameraPermission()`.
  4. Atualiza `status`.
  5. Se `granted` com stream, guarda `stream` no estado.
  6. Em exceções inesperadas, seta `status = 'error'`.
  7. Desativa loading no `finally`.

- `stopCameraTest()`
  1. Encerra stream atual.
  2. Define `stream = null`.
  3. Reseta `status` para `null`.
  4. Limpa `error`.

## 6) Fluxos de uso da câmera

### 6.1 Iniciar teste

1. Usuário clica em **"Teste sua câmera para começar"**.
2. `Hero` chama `requestPermission()`.
3. Hook chama módulo `requestCameraPermission()`.
4. Se `granted`, stream é armazenado no hook.
5. `Hero` recebe `stream`, conecta ao elemento `video` e mostra preview.
6. Botão **"Interromper teste"** é exibido abaixo do preview.

### 6.2 Interromper teste

1. Usuário clica em **"Interromper teste"**.
2. `stopCameraTest()` encerra todas as tracks do stream.
3. `stream` vira `null` e `status` volta para `null`.
4. Preview e botão de interrupção deixam de ser renderizados.

### 6.3 Casos de erro/limitação

- Permissão negada: status `denied`.
- Dispositivo sem câmera ou API indisponível: `unsupported`.
- Falha inesperada: `error`.

No estado atual, as mensagens de falha são apresentadas via `alert` no `Hero`.

## 7) Mapa rápido de arquivos

- `app/layout.tsx`: layout raiz e metadados.
- `app/page.tsx`: composição da home.
- `app/components/Header.tsx`: cabeçalho fixo.
- `app/components/Hero.tsx`: CTA + fluxo de câmera + preview + botão de interrupção.
- `app/components/Features.tsx`: cards de funcionalidades.
- `app/components/Footer.tsx`: rodapé.
- `app/globals.css`: tema e estilos globais.
- `app/lib/camera/requestCameraPermission.ts`: API de permissão de câmera.
- `app/hooks/useCameraPermission.ts`: estado/ações da câmera no React.