# Plano de modificações para câmera (futuro)

Este arquivo documenta **onde** devem ser feitas as mudanças quando você decidir implementar a solicitação de permissão da câmera a partir do botão da seção Hero.

## 1) Arquivo principal a ser alterado

### `web/app/components/Hero.tsx`

Modificar a seção do CTA (botão) para disparar a solicitação de câmera.

- Hoje o CTA está como `<Link href="#">...</Link>`.
- Quando for implementar:
  - transformar o componente em client component (`'use client'`) para permitir `onClick`/estado;
  - substituir o `href="#"` por uma ação real de clique;
  - chamar a função/hook responsável por pedir permissão da câmera;
  - tratar o resultado (`granted`, `denied`, `unsupported`, `error`) antes de seguir no fluxo.

## 2) Novo módulo recomendado para lógica de permissão

### `web/app/lib/camera/requestCameraPermission.ts` (novo)

Centralizar a lógica de permissão para não deixar regra de negócio dentro do `Hero`.

Responsabilidades esperadas:
- verificar suporte (`navigator.mediaDevices?.getUserMedia`);
- solicitar `getUserMedia({ video: true })`;
- encerrar tracks após obter o stream;
- retornar status padronizado para o componente de UI.

## 3) Hook opcional para facilitar uso em UI

### `web/app/hooks/useCameraPermission.ts` (novo, opcional)

Se quiser escalar melhor depois, encapsular estado e ações do fluxo de permissão.

Expor, por exemplo:
- `status`;
- `isLoading`;
- `error`;
- `requestPermission()`.

## 4) Feedback visual opcional

### `web/app/components/CameraPermissionFeedback.tsx` (novo, opcional)

Componente para mensagens amigáveis ao usuário quando:
- permissão for negada;
- navegador não suportar câmera;
- ocorrer erro inesperado.

## 5) Integração de navegação (se necessário)

### `web/app/page.tsx` (somente se precisar integrar fluxo)

Alterar apenas se o `Hero` passar a receber callbacks/props de navegação ou estado global.

---

## Fluxo recomendado (quando implementar)

1. Usuário clica no botão do `Hero`.
2. Aplicação solicita permissão da câmera.
3. Se `granted`, segue para próxima etapa (ex.: tela de teste de câmera).
4. Se `denied`/`unsupported`/`error`, mostrar feedback e opção de tentar novamente.

## Observações importantes

- A solicitação de câmera deve ser iniciada por interação do usuário (clique).
- Em produção, use HTTPS para maior compatibilidade de acesso à câmera.
- **Nenhuma implementação foi aplicada ainda** — este arquivo é apenas um guia de modificação.
