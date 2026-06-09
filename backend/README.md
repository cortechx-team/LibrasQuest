# LibrasQuest — Inference API (Módulo WebSocket)

Este módulo da aplicação **LibrasQuest** implementa um endpoint assíncrono via WebSockets utilizando **FastAPI**. Ele foi desenhado para receber fluxos contínuos de coordenadas tridimensionais das mãos (extraídas via MediaPipe Hands diretamente no cliente frontend) e retornar a classificação correspondente do alfabeto em Libras em tempo real com baixíssima latência.

## 📁 Estrutura do Escopo do Backend

A disposição dos módulos segue os padrões de Clean Code, isolando responsabilidades e garantindo compatibilidade total com a orquestração de contêineres e migrações existentes:


```text
backend/
├── alembic/                    # Migrações e versionamento do banco de dados
├── app/
│   ├── __init__.py
│   ├── models.py               # Modelos do banco de dados
│   ├── api/
│   │   ├── __init__.py
│   │   └── websockets.py       # Endpoint persistente e gestão de fluxo de dados
│   ├── assets/
│   │   ├── modelo.pkl          # Classificador scikit-learn treinado (RandomForest)
│   │   └── standardization_stats.csv # Pesos e métricas de normalização Z-Score
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Variáveis de ambiente e constantes globais
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── predict.py          # Contratos de dados Pydantic (Validação de Entrada/Saída)
│   └── services/
│       ├── __init__.py
│       └── inference.py        # Camada de Machine Learning (Carregamento e Inferência)
├── .dockerignore               # Arquivos ignorados durante o build da imagem
├── Dockerfile                  # Definição da imagem Docker da aplicação
├── alembic.ini                 # Configuração do Alembic
├── entrypoint.sh               # Script de inicialização do container
├── main.py                     # Inicialização da API e hooks de ciclo de vida (lifespan)
└── requirements.txt            # Dependências obrigatórias
```

## 🚀 Stack Técnica do Módulo

* **FastAPI**: Engine assíncrona voltada a endpoints de alto desempenho e WebSockets nativos.
* **SQLAlchemy & Alembic**: Mapeamento Objeto-Relacional (ORM) e controle de evolução estrutural do banco.
* **Scikit-Learn (1.6.1)**: Motor preditivo responsável pelo processamento do modelo gerado.
* **NumPy**: Biblioteca de computação científica utilizada para vetorização acelerada e normalização estatística.
* **Pydantic**: Camada de parsing e validação de payloads em tempo de execução.

## ⚙️ Arquitetura de Processamento de Sinais

1. **Descentralização**: O backend não processa streaming de vídeo bruto. Ele consome exclusivamente vetores pré-computados contendo as coordenadas das articulações da mão.
2. **Ciclo de Vida Otimizado (Lifespan)**: Tanto o arquivo `.pkl` quanto os pesos do CSV são carregados na memória RAM uma única vez durante o evento de *Startup* do servidor, mitigando latências decorrentes de operações repetitivas de Input/Output em disco.
3. **Feature Engineering & Normalização**: O script `inference.py` recebe 63 coordenadas (21 landmarks × 3 dimensões) e 16 distâncias euclidianas estruturais calculadas no frontend. Para manter compatibilidade com clientes antigos, o backend calcula essas distâncias quando `features` não é enviado. Em seguida, aplica a fórmula Z-Score (`(x - média) / desvio_padrão`) usando álgebra matricial do NumPy antes de invocar a predição.
4. **Silenciamento de I/O de Terminal**: Avisos gerados pela ausência de metadados nomeados no array NumPy são explicitamente filtrados no microsserviço de inferência para evitar gargalos de log no console ao operar em alta frequência de quadros.

## 📡 Protocolo do Canal de WebSocket (`/ws/predict`)

* **Endpoint**: `ws://<host>:<port>/ws/predict`
* **Conexão**: Persistente, assíncrona e bidirecional.

### Fluxo de Comunicação (Payloads)

**Entrada (Frontend ➔ Backend):**
Envio contínuo a cada frame computado de um array puro encapsulado no formato JSON:

```json
{
  "coordinates": [0.0, 0.0, 0.0, -0.232, -0.011, 0.004, ..., -0.614, -0.972, -0.226],
  "features": [0.706, 0.855, 0.790, ..., 0.246],
  "handedness": "Right",
  "timestamp_ms": 12345.67
}
```

`features` é opcional para compatibilidade. Quando presente, deve conter exatamente as 16
distâncias na mesma ordem de `standardization_stats.csv`. O canal de predição não exige
autenticação; login será usado apenas por funcionalidades que precisem persistir progresso.

**Saída (Backend ➔ Frontend):**
Resposta imediata contendo a caractere mapeado correspondente e o nível de confiança do classificador:

```json
{
  "letter": "C",
  "confidence": 1.0
}
```

## 🛠️ Execução do Ecossistema Backend

### Inicialização Isolada em Desenvolvimento

1. Certifique-se de ativar o ambiente virtual correspondente (`venv`).
2. Instale as dependências consolidadas:
```bash
pip install -r requirements.txt
```


3. Inicie o servidor ASGI a partir da raiz do diretório `backend/`:
```bash
uvicorn main:app --reload --port 8000
```
