# Migrations com Alembic

O projeto utiliza [Alembic](https://alembic.sqlalchemy.org/) para controle de versão do banco de dados, integrado ao SQLAlchemy.

## Estrutura

```
backend/
├── alembic/
│   ├── versions/        # arquivos de migration gerados
│   ├── env.py           # configuração do ambiente Alembic
│   └── script.py.mako   # template para geração de migrations
├── alembic.ini          # configuração principal
└── app/
    └── models.py        # modelos SQLAlchemy (fonte de verdade do schema)
```

## Como as migrations rodam

Ao subir o container do backend, o `entrypoint.sh` executa `alembic upgrade head` automaticamente antes de iniciar o servidor. O Alembic aplica apenas as migrations pendentes com base na tabela `learning.alembic_version`.

## Pré-requisitos para uso local

```bash
# Na raiz do projeto
venv\Scripts\activate           # Windows
source venv/bin/activate        # Linux/macOS

pip install -r backend/requirements.txt
```

## Comandos

### Gerar uma nova migration

Sempre que alterar um model em `app/models.py`, gere uma migration:

```bash
# É necessário o banco estar rodando
docker compose -f docker.composer.yml up postgres -d

cd backend

# Windows CMD
set DATABASE_URL=postgresql://postgres:admin@localhost:5432/librasquest_db

# PowerShell
$env:DATABASE_URL="postgresql://postgres:admin@localhost:5432/librasquest_db"

alembic revision --autogenerate -m "descricao_da_mudanca"
```

> Revise sempre o arquivo gerado em `alembic/versions/` antes de aplicar — o autogenerate pode incluir operações indesejadas.

### Aplicar migrations pendentes

```bash
alembic upgrade head
```

### Reverter a última migration

```bash
alembic downgrade -1
```

### Ver histórico de migrations

```bash
alembic history
```

### Ver versão atual do banco

```bash
alembic current
```

## Boas práticas

- **Nunca edite** um arquivo de migration já aplicado em produção — crie uma nova migration.
- **Sempre commite** os arquivos de `alembic/versions/` junto com as mudanças nos models.
- **Revise o autogenerate** antes de aplicar: ele pode não detectar corretamente renomeações de colunas ou tabelas.
- O Docker aplica as migrations automaticamente — não é necessário rodar manualmente em ambiente containerizado.
