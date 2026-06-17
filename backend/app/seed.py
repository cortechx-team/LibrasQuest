import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert

from app.models import DictionaryWord

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    
    if not url:
        raise ValueError("CRÍTICO: A variável de ambiente DATABASE_URL não foi definida. Verifique seu arquivo .env")
    
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    return url

engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


WORDS_TO_SEED = [
    "ALTO", "ARCO", "ARTE", "BASE", "BICO", "BOCA", "BOLA", "BOLO", "BOTE", "CABO",
    "CAPA", "CASA", "CENA", "COLA", "COPO", "CUBO", "DADO", "DAMA", "DANO", "DATA",
    "DEDO", "DONO", "DOSE", "FACA", "FADA", "FASE", "FATO", "FITA", "FOGO", "FOTO",
    "GADO", "GALO", "GATO", "GELO", "GOTA", "LADO", "LAGO", "LAMA", "LATA", "LEVE",
    "LISO", "LOBO", "LOTE", "LUPA", "LUVA", "MACA", "MALA", "MAPA", "MATO", "MEDO",
    "MEIO", "MESA", "META", "MOLA", "MOTO", "NAVE", "NOME", "NOVO", "NULO", "OVO",
    "PACA", "PAGO", "PANO", "PATO", "PELE", "PENA", "PESO", "PINO", "PIPA", "PLANO",
    "POTE", "PRATO", "PREGO", "RALO", "RAMO", "RARO", "RATO", "REDE", "RICA", "RICO",
    "RIO", "RISO", "RODA", "ROTA", "RUA", "RUMO", "SALA", "SAPO", "SINO", "SUCO",
    "TACO", "TEIA", "TELA", "TETO", "TIPO", "TREM", "TUDO", "UVA", "VACA", "VAGO",
]

def run_seed():
    logger.info("Iniciando o seed da tabela dictionary_words...")
    
    with SessionLocal() as session:
        try:
            values_to_insert = [{"word": word} for word in WORDS_TO_SEED]
            stmt = insert(DictionaryWord).values(values_to_insert)
            stmt = stmt.on_conflict_do_nothing(index_elements=['word'])
            result = session.execute(stmt)
            session.commit()
            logger.info("Seed concluído com sucesso!")
            
        except Exception as e:
            session.rollback()
            logger.error(f"Erro ao rodar o seed: {e}")
            raise e

if __name__ == "__main__":
    run_seed()