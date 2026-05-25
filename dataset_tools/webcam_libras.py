import cv2
import mediapipe as mp
import pandas as pd
import joblib

print("Carregando modelo e estatísticas de normalização...")
modelo = joblib.load('modelo_libras.pkl')

stats = pd.read_csv('../model/data/data_output/prepared/standardization_stats.csv')
medias = stats.set_index('feature')['mean']
desvios = stats.set_index('feature')['std']

colunas = stats['feature'].tolist()

mp_maos = mp.solutions.hands
mp_desenho = mp.solutions.drawing_utils
maos = mp_maos.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)

cap = cv2.VideoCapture(0)
print("Câmera iniciada. Pressione 'q' para sair.")

while cap.isOpened():
    sucesso, frame = cap.read()
    if not sucesso:
        continue

    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resultados = maos.process(frame_rgb)

    if resultados.multi_hand_landmarks:
        for landmarks in resultados.multi_hand_landmarks:
            mp_desenho.draw_landmarks(frame, landmarks, mp_maos.HAND_CONNECTIONS)
            # 1. Extração com invariância de translação (pulso) e escala (max_val)
            import numpy as np
            coords = np.array([[lmk.x, lmk.y, lmk.z] for lmk in landmarks.landmark])
            wrist = coords[0]
            coords = coords - wrist
            max_val = np.max(np.abs(coords))
            if max_val > 0:
                coords = coords / max_val
                
            coordenadas_mao = coords.flatten().tolist()
            
            # 2. Distâncias do pulso (que agora é 0,0,0)
            pontas = [4, 8, 12, 16, 20] 
            for idx in pontas:
                pt = coords[idx]
                dist = (pt[0]**2 + pt[1]**2 + pt[2]**2)**0.5
                coordenadas_mao.append(dist)
            
            # 3. Distâncias entre pares de pontos
            pares_distancias = [
                (8, 12), (6, 10), (5, 9),
                (4, 20), (4, 8),
                (4, 5), (4, 6), (4, 7), (4, 8),
                (8, 16), (12, 16), (16, 20)
            ]
            for idx_a, idx_b in pares_distancias:
                pt_a = coords[idx_a]
                pt_b = coords[idx_b]
                dist = ((pt_a[0] - pt_b[0])**2 + (pt_a[1] - pt_b[1])**2 + (pt_a[2] - pt_b[2])**2)**0.5
                coordenadas_mao.append(dist)
                
            # 4. Diferenças Direcionais (T vs F e W vs V)
            direcionais = [
                (4, 5, 0), # diff_x_polegar_indicador_mcp
                (4, 5, 2), # diff_z_polegar_indicador_mcp
                (4, 6, 0), # diff_x_polegar_indicador_pip
                (4, 6, 2), # diff_z_polegar_indicador_pip
                (16, 13, 1) # diff_y_anelar_mcp
            ]
            for idx_a, idx_b, eixo in direcionais:
                diff = coords[idx_a][eixo] - coords[idx_b][eixo]
                coordenadas_mao.append(diff)
            
            df_previsao = pd.DataFrame([coordenadas_mao], columns=colunas)

            df_previsao = (df_previsao - medias) / desvios

            predicao = modelo.predict(df_previsao)
            letra_prevista = predicao[0]

            cv2.putText(frame, f'Letra: {letra_prevista}', (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3, cv2.LINE_AA)

    cv2.imshow('Tradutor de Libras em Tempo Real', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
