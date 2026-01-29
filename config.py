"""
Configurações globais do Flappy Bird com controle por gestos.

Este módulo centraliza todas as configurações do jogo, permitindo
fácil ajuste de parâmetros sem modificar o código principal.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Tuple


class ControlMode(Enum):
    """Modos de controle disponíveis para o jogo."""
    DISCRETE = 1    # Modo 1: Abrir mão = subir, fechar = cair
    CONTINUOUS = 2  # Modo 2: Altura da mão controla altura do pássaro


@dataclass
class GameConfig:
    """Configurações do motor do jogo."""
    # Dimensões da tela
    screen_width: int = 400
    screen_height: int = 600
    
    # Física do jogo
    gravity: float = 0.3
    jump_strength: float = -8.0
    max_fall_speed: float = 8.0
    
    # Pássaro
    bird_x: int = 80
    bird_size: int = 30
    bird_color: Tuple[int, int, int] = (255, 255, 0)  # Amarelo
    
    # Obstáculos (canos)
    pipe_width: int = 50
    pipe_gap: int = 250  # Espaço maior para passar
    pipe_speed: float = 2.0  # Mais lento
    pipe_spawn_interval: int = 150  # Mais tempo entre canos
    pipe_color: Tuple[int, int, int] = (0, 200, 0)  # Verde
    
    # Cores
    background_color: Tuple[int, int, int] = (135, 206, 235)  # Azul céu
    ground_color: Tuple[int, int, int] = (139, 90, 43)  # Marrom
    
    # Chão
    ground_height: int = 50
    
    # FPS alvo
    target_fps: int = 60


@dataclass
class HandTrackingConfig:
    """Configurações do rastreamento de mão."""
    # Câmera
    camera_index: int = 0
    camera_width: int = 640
    camera_height: int = 480
    
    # MediaPipe Hands
    max_num_hands: int = 1
    min_detection_confidence: float = 0.7
    min_tracking_confidence: float = 0.5
    
    # Filtro temporal (média móvel)
    smoothing_window_size: int = 5
    
    # Threshold para detecção de mão aberta/fechada
    hand_open_threshold: float = 0.05  # Distância entre dedos (reduzido para maior sensibilidade)
    
    # Flip horizontal da câmera (espelho)
    flip_horizontal: bool = True


@dataclass
class GestureConfig:
    """Configurações de mapeamento de gestos."""
    # Modo de controle ativo
    control_mode: ControlMode = ControlMode.DISCRETE
    
    # Suavização do movimento no modo contínuo
    continuous_smoothing: float = 0.15  # Fator de interpolação (0-1)
    
    # Zona morta para evitar micro-movimentos
    dead_zone: float = 0.02
    
    # Inversão do eixo Y (se necessário)
    invert_y: bool = False


@dataclass
class DebugConfig:
    """Configurações de debug e desenvolvimento."""
    # Ativar modo debug
    enabled: bool = True
    
    # Mostrar informações no console
    print_hand_position: bool = True
    print_confidence: bool = True
    print_fps: bool = True
    
    # Exportar frames com overlay
    export_frames: bool = False
    export_path: str = "debug_frames"
    
    # Mostrar preview da câmera
    show_camera_preview: bool = True
    camera_preview_scale: float = 0.3


@dataclass
class AppConfig:
    """Configuração principal da aplicação."""
    game: GameConfig = None
    hand_tracking: HandTrackingConfig = None
    gesture: GestureConfig = None
    debug: DebugConfig = None
    
    def __post_init__(self):
        """Inicializa configurações padrão se não fornecidas."""
        if self.game is None:
            self.game = GameConfig()
        if self.hand_tracking is None:
            self.hand_tracking = HandTrackingConfig()
        if self.gesture is None:
            self.gesture = GestureConfig()
        if self.debug is None:
            self.debug = DebugConfig()


# Configuração global da aplicação
# Modifique aqui para alterar o comportamento do jogo
CONFIG = AppConfig(
    game=GameConfig(
        screen_width=400,
        screen_height=600,
        gravity=0.5,
        jump_strength=-10.0,
        pipe_gap=180,
        target_fps=60,
    ),
    hand_tracking=HandTrackingConfig(
        camera_index=1,  # Brio 305
        smoothing_window_size=5,
        min_detection_confidence=0.7,
    ),
    gesture=GestureConfig(
        # ALTERE AQUI PARA TROCAR O MODO DE CONTROLE
        # ControlMode.DISCRETE = Abrir/fechar mão
        # ControlMode.CONTINUOUS = Altura da mão
        control_mode=ControlMode.DISCRETE,
        continuous_smoothing=0.15,
    ),
    debug=DebugConfig(
        enabled=True,
        print_hand_position=True,
        print_confidence=True,
        print_fps=True,
        show_camera_preview=True,
        export_frames=False,
    ),
)


def get_config() -> AppConfig:
    """Retorna a configuração global da aplicação."""
    return CONFIG


def set_control_mode(mode: ControlMode) -> None:
    """
    Altera o modo de controle em tempo de execução.
    
    Args:
        mode: Novo modo de controle (DISCRETE ou CONTINUOUS)
    """
    CONFIG.gesture.control_mode = mode
    print(f"[CONFIG] Modo de controle alterado para: {mode.name}")


def toggle_debug() -> bool:
    """
    Alterna o modo debug.
    
    Returns:
        Estado atual do debug após toggle
    """
    CONFIG.debug.enabled = not CONFIG.debug.enabled
    print(f"[CONFIG] Debug: {'ATIVADO' if CONFIG.debug.enabled else 'DESATIVADO'}")
    return CONFIG.debug.enabled
