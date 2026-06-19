# Integração do Aprendizado

Este documento descreve a integração da tela de Aprendizado do LibrasQuest com o backend, o banco de dados, o WebSocket de reconhecimento de letras em Libras e os estados visuais de feedback.

## Objetivo

A tela de Aprendizado permite que o usuário treine palavras do dicionário carregado no banco, sem depender de autenticação. A experiência usa uma única tela principal, com uma opção para mostrar ou ocultar as imagens de apoio do alfabeto em Libras.

## Rotas do Frontend

### `/aprendizado`

Rota principal do Aprendizado.

Nessa tela o usuário pode:

- visualizar a palavra atual com hífens entre as letras;
- ativar a câmera;
- aguardar o carregamento do MediaPipe e do canal WebSocket;
- sinalizar a letra atual;
- receber feedback visual por cor;
- mostrar ou ocultar as dicas em Libras;
- avançar automaticamente quando acerta a letra ativa.

### `/jogo`

A tela de jogo continua separada, mas recebeu as mesmas proteções de inicialização e confiança mínima.

## Aprendizado Com ou Sem Dicas

A separação visual entre Aprendizado e Fixação foi removida, assim como a rota separada de fixação.

Agora existe apenas o Aprendizado. A diferença entre treinar com apoio visual e treinar de memória é controlada pelo switch:

```txt
Dicas em Libras: ligado/desligado
```

Quando ligado, a tela renderiza as imagens das letras em Libras.

Quando desligado, as imagens são ocultadas, mantendo a mesma palavra, o mesmo progresso e a mesma câmera.

## Palavras Vindas do Banco

As palavras mockadas no frontend foram removidas.

Agora a tela consome as palavras cadastradas no banco, preenchidas pelo seed adicionado no commit:

```txt
7091678 feat: add initial word seed via entrypoint
```

O seed popula a tabela:

```txt
learning.dictionary_words
```

com palavras como:

```txt
ALTO, ARCO, ARTE, BASE, BICO, BOCA, BOLA, CASA, ...
```

## Endpoint Público de Dicionário

Foi criado um endpoint público para listar as palavras usadas no Aprendizado:

```http
GET /dictionary/words
```

Esse endpoint não exige login nem token.

Resposta esperada:

```json
[
  {
    "id": 1,
    "word": "ALTO",
    "created_at": "2026-06-17T12:00:00"
  }
]
```

Arquivos adicionados:

```txt
backend/app/api/dictionary.py
backend/app/schemas/dictionary.py
```

O router foi registrado em:

```txt
backend/main.py
```

## Consumo das Palavras no Frontend

Foi criado um client para buscar as palavras do backend:

```txt
web/app/lib/dictionary.ts
```

Ele chama:

```txt
GET {NEXT_PUBLIC_API_URL}/dictionary/words
```

ou, se `NEXT_PUBLIC_API_URL` não estiver configurado:

```txt
http://localhost:8000/dictionary/words
```

A função exposta é:

```ts
fetchDictionaryWords(): Promise<string[]>
```

Também foi criado um helper compartilhado de API:

```txt
web/app/lib/api.ts
```

Esse helper centraliza a resolução da URL base do backend.

## Montagem das Letras

Cada palavra recebida do banco é transformada em uma estrutura interna para a tela.

Exemplo:

```txt
BOLA
```

vira:

```txt
B-O-L-A
```

Cada letra possui:

- `expected`: letra normalizada em maiúsculo, usada para comparar com a predição;
- `display`: letra exibida na interface.

Como as palavras seedadas estão em maiúsculo e sem acentos, a tela exibe as mesmas letras do banco.

## Estados Visuais das Letras

A palavra usa uma máquina visual simples:

```txt
Amarelo = letra atual
Verde = letra acertada
Vermelho = erro na letra ativa
```

Comportamento:

- a letra ativa começa em amarelo;
- se o usuário sinaliza corretamente, ela fica verde e o cursor avança;
- se o usuário sinaliza uma letra errada, a letra ativa fica vermelha;
- se a confiança for menor que 50%, a interface não marca erro nem acerto.

## Filtro de Confiança

Foi criado um helper compartilhado:

```txt
web/app/lib/prediction.ts
```

Constante principal:

```ts
MINIMUM_PREDICTION_CONFIDENCE = 0.5
```

Regra:

```txt
confidence < 0.50 => "Nenhuma letra reconhecida"
```

Quando isso acontece:

- a letra ativa não avança;
- a interface não marca acerto;
- a interface não marca erro;
- o usuário continua tentando a mesma letra.

Essa regra foi aplicada em:

```txt
web/app/components/PracticeExperience.tsx
web/app/jogo/page.tsx
```

## Loading da Câmera e Modelo

A tela mostra um overlay de carregamento sobre o preview da câmera enquanto o sistema ainda não está pronto.

O loader cobre estes estados:

- câmera ativa, mas MediaPipe ainda carregando;
- WebSocket ainda conectando;
- WebSocket aberto, mas handshake de modelo ainda não confirmado.

Mensagens possíveis:

```txt
Conectando ao reconhecimento...
Validando modelo de reconhecimento...
Carregando modelo da câmera...
Preparando captura...
```

Se a conexão falhar, o loader sai da tela e a interface exibe uma mensagem de erro.

## Handshake do WebSocket

Antes, o frontend considerava a conexão pronta assim que o WebSocket abria.

Agora o backend envia uma mensagem explícita de prontidão logo após aceitar a conexão:

```json
{
  "type": "ready",
  "model_loaded": true
}
```

Arquivo alterado:

```txt
backend/app/api/websockets.py
```

O frontend só envia frames quando:

- o WebSocket está aberto;
- a mensagem `ready` já foi recebida;
- não existe outra predição pendente.

Arquivo alterado:

```txt
web/app/hooks/usePredictionSocket.ts
```

## Fluxo Completo do Aprendizado

1. O usuário acessa:

```txt
http://localhost:3000/aprendizado
```

2. O frontend busca as palavras:

```txt
GET http://localhost:8000/dictionary/words
```

3. A primeira palavra do dicionário é selecionada.

4. A palavra é exibida com hífens:

```txt
A-L-T-O
```

5. O usuário ativa a câmera.

6. O MediaPipe carrega o modelo local de detecção da mão.

7. O frontend abre o WebSocket:

```txt
ws://localhost:8000/ws/predict
```

8. O backend responde com:

```json
{ "type": "ready", "model_loaded": true }
```

9. O frontend começa a enviar frames.

10. O backend retorna predições:

```json
{
  "letter": "A",
  "confidence": 0.87
}
```

11. O frontend aplica o filtro de confiança.

12. Se a letra reconhecida for a esperada, a letra fica verde e o cursor avança.

13. Se a letra reconhecida for diferente, a letra ativa fica vermelha.

14. Se `confidence < 0.50`, aparece:

```txt
Nenhuma letra reconhecida
```

15. Ao terminar a palavra, a tela avança para a próxima palavra do banco.

## Como Subir com Docker

O fluxo esperado do projeto é iniciar banco, backend e frontend pelo Docker Compose.

### 1. Criar o arquivo `.env`

Na raiz do projeto:

```bash
cp .env.example .env
```

O `.env.example` já traz valores de desenvolvimento:

```env
POSTGRES_USER=librasquest
POSTGRES_PASSWORD=librasquest
POSTGRES_DB=librasquest
DATABASE_URL=postgresql://librasquest:librasquest@postgres:5432/librasquest
JWT_SECRET_KEY=sua-chave-secreta-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PREDICTION_WS_URL=ws://localhost:8000/ws/predict
```

### 2. Subir os containers

```bash
docker compose up --build
```

Esse comando sobe:

- `postgres`, com o banco de dados;
- `backend`, executando migrations, seed de palavras e API em `:8000`;
- `frontend`, executando Next em `:3000`.

No container de frontend, o Next roda em modo dev com webpack:

```bash
npm run dev -- --webpack -H 0.0.0.0
```

Isso evita erros de chunks obsoletos do Turbopack durante alterações de rotas em desenvolvimento.

O entrypoint do backend executa automaticamente:

```bash
alembic upgrade head
python -m app.seed
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Verificar containers

```bash
docker compose ps
```

Os serviços esperados são:

```txt
db_postgres
backend_librasquest
web_librasquest
```

### 4. Ver logs do backend

```bash
docker compose logs -f backend
```

Procure por mensagens de:

```txt
Rodando migrations...
Seed concluído com sucesso!
Iniciando servidor...
Modelo carregado com sucesso.
```

## Como Testar

Com backend, banco e frontend rodando:

### 1. Verificar se o dicionário está vindo do banco

```bash
curl http://localhost:8000/dictionary/words
```

Deve retornar a lista de palavras seedadas.

### 2. Testar o Aprendizado

Abra:

```txt
http://localhost:3000/aprendizado
```

Critérios esperados:

- a lista lateral mostra palavras vindas do banco;
- a palavra selecionada aparece separada por hífens;
- o switch "Dicas em Libras" mostra ou oculta as imagens;
- a câmera exibe loader enquanto o modelo/WebSocket inicializa;
- predições abaixo de 50% exibem "Nenhuma letra reconhecida";
- letra correta avança o progresso;
- letra incorreta marca a letra ativa em vermelho.

### 3. Testar jogo

Abra:

```txt
http://localhost:3000/jogo
```

O jogo deve manter o comportamento anterior, mas agora também com:

- loader de inicialização;
- handshake do WebSocket;
- filtro de confiança mínima.

## Variáveis de Ambiente

### Frontend

Opcional:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PREDICTION_WS_URL=ws://localhost:8000/ws/predict
```

Se não forem definidas, o frontend assume:

```txt
http://localhost:8000
ws://localhost:8000/ws/predict
```

### Backend

O backend precisa de:

```env
DATABASE_URL=...
JWT_SECRET_KEY=...
FRONTEND_ORIGIN=http://localhost:3000
```

O Aprendizado não depende de autenticação, mas o backend ainda usa `JWT_SECRET_KEY` para as rotas de auth existentes.

## Observações

- O Aprendizado não depende de login.
- As imagens de dicas usam os assets em:

```txt
web/public/Letras_LBQ/
```
- O dicionário seedado deve conter apenas letras que existam no classificador e nas imagens de apoio.
