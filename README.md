# 🤟 [LibrasQuest]

> **Uma plataforma interativa e gamificada para o aprendizado da Língua Brasileira de Sinais (Libras), movida a Visão Computacional.**

Desenvolvido pela **Diretoria de Visão Computacional da Liga Acadêmica CorteCHX**, este projeto transforma a webcam do usuário em uma ferramenta de acessibilidade e educação. Através do rastreamento de mãos em tempo real e inteligência artificial, o sistema valida soletrações e propõe desafios interativos para o ensino do alfabeto manual em Libras.

---

## 🎯 Funcionalidades (MVP 1)

O sistema foi desenhado para oferecer uma progressão de aprendizado intuitiva:

* **Modo de Aprendizado:** O usuário deve soletrar palavras geradas pelo sistema com o auxílio visual de fotos de cada símbolo de Libras. O validador de IA confirma o acerto em tempo real.
* **Modo de Fixação:** Modo avançado de soletração sem o auxílio das imagens, testando a retenção de memória do usuário.
* **Jogo da Forca em Libras:** O clássico minigame. O usuário sinaliza as letras para a câmera para tentar descobrir a palavra oculta antes de perder todas as vidas.

## 🛠️ Arquitetura e Stack Tecnológica

A arquitetura foi pensada para garantir **baixa latência** no reconhecimento dos sinais, utilizando um modelo híbrido (extração de *landmarks* 3D + modelo clássico de ML) em vez de processamento pesado de imagens.

* **Visão Computacional & IA (Backend):** `Python`
    * `MediaPipe`: Extração de coordenadas (63 pontos/landmarks) das mãos.
    * `Scikit-Learn` / `TensorFlow`: Classificador leve treinado sobre as coordenadas para identificar as 26 letras do alfabeto.
    * `FastAPI`: API assíncrona de alta performance.
* **Interface e Lógica de Jogo (Frontend/Web):** `Node.js` (WebSockets para comunicação em tempo real).
* **Banco de Dados:** `PostgreSQL` (Gerenciamento de usuários, dicionário de palavras e histórico de pontuação).
* **Infraestrutura:** `Docker` e `Docker Compose` (Conteinerização completa de todos os serviços).

---

## ⚙️ Como rodar o projeto localmente

Como o projeto é 100% conteinerizado, o setup inicial é extremamente simples. 

### Pré-requisitos
* [Docker](https://www.docker.com/) instalado.
* [Docker Compose](https://docs.docker.com/compose/) instalado.
* Uma webcam funcional conectada ao computador.

### Passos para Execução

1. Clone este repositório:
   ```bash
   git clone [https://github.com/sua-organizacao/nome-do-projeto.git](https://github.com/sua-organizacao/nome-do-projeto.git)
   cd nome-do-projeto
