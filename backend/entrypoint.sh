#!/bin/sh
set -e

echo "Rodando migrations..."
alembic upgrade head

python -m app.seed

echo "Iniciando servidor..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
