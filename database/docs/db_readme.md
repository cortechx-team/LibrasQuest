# :page_facing_up: Documentação do Schema do Banco de Dados

Esta documentação descreve o schema inicial do banco de dados PostgreSQL para a aplicação, contendo as tabelas responsáveis por armazenar os usuários, o dicionário de palavras e o progresso de aprendizagem.

## Estrutura do Banco (DDL)

O script SQL (`db_schema.sql`) define o schema `learning` e implementa três entidades principais com seus respectivos relacionamentos:

* **users**: Armazena as credenciais e dados de identificação dos usuários.
* **dictionary_words**: Guarda as palavras-alvo e armazena os links para até três imagens de dica.
* **user_progress**: Registra a interação do usuário com cada palavra, computando pontuação e vidas perdidas. Utiliza uma chave composta (UNIQUE) para garantir que cada usuário tenha apenas um registro de progresso por palavra.

## Como Executar Localmente com Docker

Para testar a criação das tabelas em um ambiente isolado, utilize os comandos abaixo para instanciar um container PostgreSQL:

1. Inicie o container de banco de dados:
   ```bash
   docker run --name LibresQuestTest -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5433:5432 -d postgres
   ```

2. Execute o script db_schema.sql para popular o schema inicial:
  - No Linux/Mac ou Git Bash:

    ```bash
    docker exec -i LibresQuestTest psql -U postgres -d postgres < db_schema.sql
     ```

  - No PowerShell (Windows):

    ```bash
    Get-Content db_schema.sql | docker exec -i LibresQuestTest psql -U postgres -d postgres
    ```
## Melhorias Propostas e Dúvidas

**Melhorias:**
* Implementar uma `TRIGGER` para atualizar automaticamente o momento da última interação.
* Criar um `INDEX` em colunas fundamentais (como o email) para otimização de consultas.

**Dúvidas e Pendências:**
* **Banco de Dados:** Confirmar o uso do Postgres via Docker ou a necessidade de criar um banco dedicado.
* **Regra de Vidas:** Definir se haverá um limite superior estrutural para as vidas perdidas.
* **Modelo Lógico:** Escolher entre os dois modelos lógicos disponíveis ou refazê-lo do zero. (mantive ambos em `./docs/`)
    