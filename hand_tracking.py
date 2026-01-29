"""
Módulo de Rastreamento de Mão via Webcam.

Utiliza MediaPipe Hands para detectar e rastrear a mão do usuário
em tempo real, fornecendo posição, landmarks e estado da mão.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Tuple, List, NamedTuple
from dataclasses import dataclass
from collections import deque
import time

from config import HandTrackingConfig, get_config


@dataclass
class HandData:
    """
    Dados da mão detectada.
    
    Attributes:
        position: Posição normalizada (x, y) do centro da mão (0-1)
        landmarks: Lista de landmarks da mão (21 pontos)
        is_detected: Se uma mão foi detectada no frame
        confidence: Confiança da detecção (0-1)
        is_open: Se a mão está aberta
        handedness: 'Left' ou 'Right'
        finger_states: Estado de cada dedo (aberto/fechado)
        raw_y: Posição Y bruta (sem filtro)
        filtered_y: Posição Y filtrada (com média móvel)
    """
    position: Tuple[float, float] = (0.5, 0.5)
    landmarks: Optional[List] = None
    is_detected: bool = False
    confidence: float = 0.0
    is_open: bool = False
    handedness: str = "Unknown"
    finger_states: List[bool] = None
    raw_y: float = 0.5
    filtered_y: float = 0.5
    
    def __post_init__(self):
        if self.finger_states is None:
            self.finger_states = [False] * 5


class TemporalFilter:
    """
    Filtro temporal usando média móvel para suavizar detecções.
    
    Reduz o jitter (tremor) nas coordenadas detectadas,
    proporcionando movimento mais fluido.
    """
    
    def __init__(self, window_size: int = 5):
        """
        Inicializa o filtro temporal.
        
        Args:
            window_size: Tamanho da janela de média móvel
        """
        self.window_size = window_size
        self.x_buffer: deque = deque(maxlen=window_size)
        self.y_buffer: deque = deque(maxlen=window_size)
        self.confidence_buffer: deque = deque(maxlen=window_size)
    
    def update(self, x: float, y: float, confidence: float = 1.0) -> Tuple[float, float]:
        """
        Atualiza o filtro com novos valores e retorna valores suavizados.
        
        Args:
            x: Coordenada X bruta
            y: Coordenada Y bruta
            confidence: Confiança da detecção
            
        Returns:
            Tuple com (x, y) suavizados
        """
        self.x_buffer.append(x)
        self.y_buffer.append(y)
        self.confidence_buffer.append(confidence)
        
        # Média ponderada pela confiança
        if sum(self.confidence_buffer) > 0:
            weights = np.array(self.confidence_buffer)
            weights = weights / weights.sum()
            
            filtered_x = np.average(self.x_buffer, weights=weights)
            filtered_y = np.average(self.y_buffer, weights=weights)
        else:
            filtered_x = np.mean(self.x_buffer)
            filtered_y = np.mean(self.y_buffer)
        
        return filtered_x, filtered_y
    
    def reset(self):
        """Limpa os buffers do filtro."""
        self.x_buffer.clear()
        self.y_buffer.clear()
        self.confidence_buffer.clear()


class HandTracker:
    """
    Classe principal para rastreamento de mão via webcam.
    
    Utiliza MediaPipe Hands para detectar landmarks da mão
    e fornece métodos para extrair informações úteis como
    posição, estado aberto/fechado e confiança.
    """
    
    # Índices dos landmarks dos dedos (ponta de cada dedo)
    FINGER_TIPS = [4, 8, 12, 16, 20]  # Polegar, Indicador, Médio, Anelar, Mínimo
    FINGER_PIPS = [2, 6, 10, 14, 18]  # Articulações médias
    
    def __init__(self, config: Optional[HandTrackingConfig] = None):
        """
        Inicializa o rastreador de mão.
        
        Args:
            config: Configurações de rastreamento (usa padrão se None)
        """
        self.config = config or get_config().hand_tracking
        
        # Inicializa MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=self.config.max_num_hands,
            min_detection_confidence=self.config.min_detection_confidence,
            min_tracking_confidence=self.config.min_tracking_confidence,
        )
        
        # Inicializa câmera
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        
        # Filtro temporal
        self.temporal_filter = TemporalFilter(self.config.smoothing_window_size)
        
        # Métricas
        self.fps = 0.0
        self.last_frame_time = time.time()
        self.frame_count = 0
        
        # Último frame e dados
        self.last_frame: Optional[np.ndarray] = None
        self.last_hand_data = HandData()
    
    def start(self) -> bool:
        """
        Inicia a captura da webcam.
        
        Returns:
            True se a câmera foi iniciada com sucesso
        """
        if self.is_running:
            return True
        
        self.cap = cv2.VideoCapture(self.config.camera_index)
        
        if not self.cap.isOpened():
            print(f"[ERRO] Não foi possível abrir a câmera {self.config.camera_index}")
            return False
        
        # Configura resolução
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.camera_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.camera_height)
        
        # Reduz buffer para menor latência
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        self.is_running = True
        self.last_frame_time = time.time()
        print(f"[INFO] Câmera iniciada: {self.config.camera_width}x{self.config.camera_height}")
        
        return True
    
    def stop(self):
        """Para a captura da webcam e libera recursos."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        self.hands.close()
        self.is_running = False
        self.temporal_filter.reset()
        print("[INFO] Câmera e rastreamento encerrados")
    
    def _calculate_fps(self):
        """Calcula FPS atual."""
        current_time = time.time()
        elapsed = current_time - self.last_frame_time
        
        if elapsed > 0:
            # Média móvel exponencial do FPS
            instant_fps = 1.0 / elapsed
            self.fps = 0.9 * self.fps + 0.1 * instant_fps
        
        self.last_frame_time = current_time
        self.frame_count += 1
    
    def _check_hand_open(self, landmarks) -> Tuple[bool, List[bool]]:
        """
        Verifica se a mão está aberta analisando a posição dos dedos.
        
        Args:
            landmarks: Landmarks da mão do MediaPipe
            
        Returns:
            Tuple (mão_aberta, lista_estado_dedos)
        """
        finger_states = []
        
        # Polegar: compara X (considerando mão direita/esquerda)
        thumb_tip = landmarks.landmark[self.FINGER_TIPS[0]]
        thumb_ip = landmarks.landmark[self.FINGER_PIPS[0]]
        
        # Simplificado: polegar aberto se a ponta está mais longe do centro
        thumb_open = abs(thumb_tip.x - 0.5) > abs(thumb_ip.x - 0.5)
        finger_states.append(thumb_open)
        
        # Outros dedos: compara Y (ponta acima da articulação = aberto)
        for tip_idx, pip_idx in zip(self.FINGER_TIPS[1:], self.FINGER_PIPS[1:]):
            tip = landmarks.landmark[tip_idx]
            pip = landmarks.landmark[pip_idx]
            
            # Y invertido: menor Y = mais alto na imagem
            is_open = tip.y < pip.y - self.config.hand_open_threshold
            finger_states.append(is_open)
        
        # Mão aberta se maioria dos dedos está aberta (3+ dedos)
        open_count = sum(finger_states)
        is_open = open_count >= 3
        
        return is_open, finger_states
    
    def _get_hand_center(self, landmarks) -> Tuple[float, float]:
        """
        Calcula o centro da mão baseado nos landmarks.
        
        Usa a média ponderada dos landmarks principais
        (pulso e base dos dedos).
        
        Args:
            landmarks: Landmarks da mão
            
        Returns:
            Tuple (x, y) normalizado (0-1)
        """
        # Landmarks importantes: pulso (0) e base dos dedos (5, 9, 13, 17)
        key_points = [0, 5, 9, 13, 17]
        
        x_sum = 0.0
        y_sum = 0.0
        
        for idx in key_points:
            x_sum += landmarks.landmark[idx].x
            y_sum += landmarks.landmark[idx].y
        
        center_x = x_sum / len(key_points)
        center_y = y_sum / len(key_points)
        
        return center_x, center_y
    
    def process_frame(self) -> Tuple[Optional[np.ndarray], HandData]:
        """
        Captura e processa um frame da webcam.
        
        Returns:
            Tuple (frame_processado, dados_da_mão)
        """
        if not self.is_running or self.cap is None:
            return None, HandData()
        
        # Captura frame
        ret, frame = self.cap.read()
        
        if not ret:
            print("[AVISO] Falha ao capturar frame")
            return self.last_frame, self.last_hand_data
        
        # Flip horizontal (espelho)
        if self.config.flip_horizontal:
            frame = cv2.flip(frame, 1)
        
        # Converte para RGB (MediaPipe usa RGB)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Processa com MediaPipe
        rgb_frame.flags.writeable = False
        results = self.hands.process(rgb_frame)
        rgb_frame.flags.writeable = True
        
        # Calcula FPS
        self._calculate_fps()
        
        # Processa resultados
        hand_data = HandData()
        
        if results.multi_hand_landmarks and results.multi_handedness:
            # Pega primeira mão detectada
            hand_landmarks = results.multi_hand_landmarks[0]
            handedness_info = results.multi_handedness[0]
            
            # Extrai informações
            hand_data.is_detected = True
            hand_data.landmarks = hand_landmarks
            hand_data.handedness = handedness_info.classification[0].label
            hand_data.confidence = handedness_info.classification[0].score
            
            # Calcula centro da mão
            raw_x, raw_y = self._get_hand_center(hand_landmarks)
            hand_data.raw_y = raw_y
            
            # Aplica filtro temporal
            filtered_x, filtered_y = self.temporal_filter.update(
                raw_x, raw_y, hand_data.confidence
            )
            hand_data.position = (filtered_x, filtered_y)
            hand_data.filtered_y = filtered_y
            
            # Verifica estado da mão
            hand_data.is_open, hand_data.finger_states = self._check_hand_open(hand_landmarks)
        else:
            # Sem mão detectada
            hand_data.is_detected = False
            # Mantém última posição filtrada para evitar saltos
            hand_data.position = self.last_hand_data.position
            hand_data.filtered_y = self.last_hand_data.filtered_y
        
        # Armazena para referência
        self.last_frame = frame
        self.last_hand_data = hand_data
        
        return frame, hand_data
    
    def draw_landmarks(self, frame: np.ndarray, hand_data: HandData) -> np.ndarray:
        """
        Desenha os landmarks da mão no frame.
        
        Args:
            frame: Frame de vídeo
            hand_data: Dados da mão detectada
            
        Returns:
            Frame com landmarks desenhados
        """
        if hand_data.landmarks is not None:
            self.mp_drawing.draw_landmarks(
                frame,
                hand_data.landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing_styles.get_default_hand_landmarks_style(),
                self.mp_drawing_styles.get_default_hand_connections_style(),
            )
        
        return frame
    
    def draw_debug_info(self, frame: np.ndarray, hand_data: HandData) -> np.ndarray:
        """
        Desenha informações de debug no frame.
        
        Args:
            frame: Frame de vídeo
            hand_data: Dados da mão
            
        Returns:
            Frame com informações de debug
        """
        h, w = frame.shape[:2]
        
        # Cor baseada no estado
        color = (0, 255, 0) if hand_data.is_detected else (0, 0, 255)
        
        # Informações de texto
        info_lines = [
            f"FPS: {self.fps:.1f}",
            f"Detectada: {'Sim' if hand_data.is_detected else 'Nao'}",
            f"Confianca: {hand_data.confidence:.2f}",
            f"Mao: {hand_data.handedness}",
            f"Aberta: {'Sim' if hand_data.is_open else 'Nao'}",
            f"Y filtrado: {hand_data.filtered_y:.3f}",
        ]
        
        y_offset = 30
        for line in info_lines:
            cv2.putText(
                frame, line, (10, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2
            )
            y_offset += 25
        
        # Desenha círculo na posição da mão
        if hand_data.is_detected:
            cx = int(hand_data.position[0] * w)
            cy = int(hand_data.position[1] * h)
            
            # Círculo maior se mão aberta
            radius = 30 if hand_data.is_open else 15
            cv2.circle(frame, (cx, cy), radius, (0, 255, 255), 3)
        
        return frame
    
    def get_fps(self) -> float:
        """Retorna o FPS atual."""
        return self.fps
    
    def get_frame_count(self) -> int:
        """Retorna contagem total de frames."""
        return self.frame_count


# Exemplo de uso standalone
if __name__ == "__main__":
    print("=== Teste do Hand Tracker ===")
    
    tracker = HandTracker()
    
    if tracker.start():
        print("Pressione 'q' para sair")
        
        while True:
            frame, hand_data = tracker.process_frame()
            
            if frame is not None:
                # Desenha informações
                frame = tracker.draw_landmarks(frame, hand_data)
                frame = tracker.draw_debug_info(frame, hand_data)
                
                # Mostra frame
                cv2.imshow("Hand Tracking Test", frame)
                
                # Debug no console
                if hand_data.is_detected:
                    print(f"\rY: {hand_data.filtered_y:.3f} | "
                          f"Aberta: {hand_data.is_open} | "
                          f"FPS: {tracker.get_fps():.1f}", end="")
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        tracker.stop()
        cv2.destroyAllWindows()
        print("\nTeste finalizado!")
