import argparse
import os
import cv2
import mediapipe as mp
import pandas as pd
import numpy as np

def parse_args():
    parser = argparse.ArgumentParser(description="Ferramenta de Geração de Dataset para LibrasQuest")
    parser.add_argument("--mode", type=str, choices=["camera", "images"], default="camera",
                        help="Modo de execução: 'camera' para captura em tempo real ou 'images' para processar diretório.")
    parser.add_argument("--image_dir", type=str, default="",
                        help="Caminho para o diretório de imagens (se --mode images). A estrutura deve ser pasta_da_letra/imagem.jpg ou passe --label se as imagens da pasta forem de uma única letra.")
    parser.add_argument("--label", type=str, default="",
                        help="Label das imagens, se não forem separadas por pasta no modo 'images'.")
    parser.add_argument("--output", type=str, default="dataset.csv",
                        help="Nome do arquivo CSV de saída. Padrão: dataset.csv")
    return parser.parse_args()

def normalize_landmarks(landmarks):
    """
    Normaliza as coordenadas:
    1. O Landmark 0 (pulso) se torna a origem (0,0,0) subtraindo-o de todos os outros pontos.
    2. Divide pelo maior valor absoluto encontrado para garantir invariância de escala.
    """
    coords = np.array([[lmk.x, lmk.y, lmk.z] for lmk in landmarks.landmark])
    
    # 1. Pulso na origem
    wrist = coords[0]
    coords = coords - wrist
    
    # 2. Invariância de escala
    max_val = np.max(np.abs(coords))
    if max_val > 0:
        coords = coords / max_val
        
    return coords.flatten().tolist()

def process_image(image, mp_hands, hands):
    """
    Processa uma imagem e retorna os landmarks normalizados
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)
    
    data_row = None
    if results.multi_hand_landmarks:
        # Pega apenas a primeira mão detectada
        hand_landmarks = results.multi_hand_landmarks[0]
        data_row = normalize_landmarks(hand_landmarks)
        
        # Opcional: Desenhar landmarks para visualização
        mp_drawing = mp.solutions.drawing_utils
        mp_drawing.draw_landmarks(
            image, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
    return data_row, image

def save_to_csv(data_buffer, filename):
    """
    Salva os dados obtidos no arquivo CSV.
    """
    if not data_buffer:
        return
        
    columns = ['label'] + [f'{axis}{i}' for i in range(21) for axis in ['x', 'y', 'z']]
    df = pd.DataFrame(data_buffer, columns=columns)
    
    if os.path.exists(filename):
        df.to_csv(filename, mode='a', header=False, index=False)
    else:
        df.to_csv(filename, mode='w', header=True, index=False)
        
    print(f"[{len(data_buffer)} amostras] salvas em {filename}")

def run_camera_mode(args):
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Erro ao abrir a webcam.")
        return

    print("=== MODO CÂMERA ===")
    print("Aperte 'ESC' para sair.")
    
    current_label = input("Digite a letra que você irá gravar (ou 'q' para sair): ").strip().upper()
    if current_label.lower() == 'q':
        return

    recording = False
    data_buffer = []

    print(f"Letra '{current_label}' selecionada.")
    print("Pressione 'r' para iniciar/parar a gravação.")
    print("Pressione 'n' para trocar a letra.")

    while True:
        success, frame = cap.read()
        if not success:
            continue

        frame = cv2.flip(frame, 1)

        data_row, processed_frame = process_image(frame, mp_hands, hands)
        
        if recording and data_row:
            row = [current_label] + data_row
            data_buffer.append(row)
            
            cv2.circle(processed_frame, (30, 30), 10, (0, 0, 255), -1)
            cv2.putText(processed_frame, f"GRAVANDO: {current_label} ({len(data_buffer)})", 
                        (50, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        elif not recording:
            cv2.putText(processed_frame, f"PAUSADO - Pressione 'R' para gravar '{current_label}'", 
                        (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

        cv2.imshow("LibrasQuest Dataset Coletor", processed_frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == 27: # ESC
            break
        elif key == ord('r') or key == ord('R'):
            recording = not recording
            if not recording and len(data_buffer) > 0:
                save_to_csv(data_buffer, args.output)
                data_buffer = [] # Limpa o buffer após salvar
        elif key == ord('n') or key == ord('N'):
            if recording:
                recording = False
                if len(data_buffer) > 0:
                    save_to_csv(data_buffer, args.output)
                    data_buffer = []
            
            # Fecha a janela temporariamente para o input no terminal
            cv2.destroyWindow("LibrasQuest Dataset Coletor")
            current_label = input("Digite a nova letra (ou 'q' para sair): ").strip().upper()
            if current_label.lower() == 'q':
                break

    if len(data_buffer) > 0:
        save_to_csv(data_buffer, args.output)
        
    cap.release()
    cv2.destroyAllWindows()
    hands.close()

def run_images_mode(args):
    if not args.image_dir or not os.path.exists(args.image_dir):
        print("Erro: O diretório de imagens fornecido não existe ou não foi informado (--image_dir).")
        return
        
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5
    )
    
    data_buffer = []
    
    print(f"Lendo diretório: {args.image_dir}")
    
    # Percorre o diretório
    for root, dirs, files in os.walk(args.image_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                filepath = os.path.join(root, file)
                
                # Se label não foi passado, infere da pasta mãe
                if args.label:
                    label = args.label.upper()
                else:
                    label = os.path.basename(root).upper()
                    
                image = cv2.imread(filepath)
                if image is None:
                    continue
                    
                data_row, _ = process_image(image, mp_hands, hands)
                
                if data_row:
                    row = [label] + data_row
                    data_buffer.append(row)
                    
                if len(data_buffer) >= 100:
                    save_to_csv(data_buffer, args.output)
                    data_buffer = []
                    
    if len(data_buffer) > 0:
        save_to_csv(data_buffer, args.output)
        
    hands.close()
    print("Processamento de imagens concluído.")

def main():
    args = parse_args()
    if args.mode == "camera":
        run_camera_mode(args)
    else:
        run_images_mode(args)

if __name__ == "__main__":
    main()
