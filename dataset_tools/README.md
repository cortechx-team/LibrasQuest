# Ferramentas de Geração de Dataset - LibrasQuest

Este diretório contém os scripts essenciais para coletar dados (imagens ou vídeo ao vivo) e extrair os landmarks das mãos usando o MediaPipe. O objetivo é criar um dataset consistente para o treinamento do modelo de Inteligência Artificial do LibrasQuest.

## Requisitos

As dependências do projeto estão listadas no arquivo `requirements.txt`. Para instalar, recomendamos o uso de um ambiente virtual Python (`venv`).

### Criando o ambiente virtual e instalando (Windows)

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Criando o ambiente virtual e instalando (Linux/Mac)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Como usar o `collect_data.py`

Este script possui dois modos de operação principais: **Câmera** e **Imagens**. 
Ele extrai os 21 pontos (landmarks) da mão detectada, normaliza as coordenadas (trazendo o pulso para o centro `(0,0,0)` e ajustando a escala) e salva tudo em um arquivo `.csv` de 64 colunas (sendo a primeira coluna a letra correspondente, e as demais os valores `X, Y, Z` de cada ponto).

### Modo Câmera (Tempo Real)

Para coletar dados usando sua webcam, execute:

```bash
python collect_data.py --mode camera
```

1. O terminal pedirá a letra que você deseja gravar (ex: `A`).
2. A câmera será aberta. Quando estiver pronto, pressione a tecla `R` para iniciar a gravação dos landmarks frame a frame.
3. Para pausar a gravação daquela letra, pressione `R` novamente.
4. Para trocar a letra, pressione `N`.
5. Para sair da câmera, pressione `ESC`.

Os dados serão automaticamente salvos no arquivo `dataset.csv` a cada parada de gravação ou troca de letra.

### Modo Imagens

Caso você já possua um conjunto de imagens organizadas em pastas (onde o nome da pasta é a letra correspondente, ex: `dataset_cru/A/img1.jpg`), você pode usar o modo imagens para processá-las de uma vez:

```bash
python collect_data.py --mode images --image_dir caminho/para/dataset_cru
```

Você também pode forçar uma *label* específica caso as imagens não estejam em subpastas:

```bash
python collect_data.py --mode images --image_dir caminho/para/imagens_do_A --label A
```

### Argumentos Opcionais

- `--output`: Define o nome do arquivo CSV de saída. O padrão é `dataset.csv`. Exemplo: `--output meu_dataset.csv`.
