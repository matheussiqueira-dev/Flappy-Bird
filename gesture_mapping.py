"""
Módulo de Mapeamento de Gestos.

Responsável por interpretar os dados da mão detectada e
convertê-los em comandos para o jogo, suportando dois modos:
- Modo Discreto: Mão aberta/fechada controla pulo
- Modo Contínuo: Altura da mão controla altura do pássaro
"""

from typing import Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from config import ControlMode, GestureConfig, get_config
from hand_tracking import HandData


@dataclass
class GestureCommand:
    """
    Comando gerado a partir da interpretação do gesto.
    
    Attributes:
        should_jump: Se o pássaro deve pular (modo discreto)
        target_y: Altura alvo normalizada (0-1) para o pássaro (modo contínuo)
        is_valid: Se o comando é válido (mão detectada)
        raw_y: Posição Y bruta da mão
        smoothed_y: Posição Y suavizada
        hand_state: Estado da mão (aberta/fechada)
        control_mode: Modo de controle atual
    """
    should_jump: bool = False
    target_y: float = 0.5
    is_valid: bool = False
    raw_y: float = 0.5
    smoothed_y: float = 0.5
    hand_state: str = "unknown"
    control_mode: ControlMode = ControlMode.DISCRETE


class GestureState(Enum):
    """Estados possíveis da máquina de estados de gestos."""
    IDLE = "idle"
    HAND_OPEN = "hand_open"
    HAND_CLOSED = "hand_closed"
    TRANSITIONING = "transitioning"


class GestureMapper:
    """
    Classe para mapear gestos da mão em comandos do jogo.
    
    Implementa uma máquina de estados para detectar transições
    entre mão aberta e fechada, evitando comandos espúrios.
    """
    
    def __init__(self, config: Optional[GestureConfig] = None):
        """
        Inicializa o mapeador de gestos.
        
        Args:
            config: Configurações de gesto (usa padrão se None)
        """
        self.config = config or get_config().gesture
        
        # Estado atual
        self.current_state = GestureState.IDLE
        self.previous_hand_open: Optional[bool] = None
        
        # Suavização para modo contínuo
        self.smoothed_target_y = 0.5
        self.last_valid_y = 0.5
        
        # Contador para debounce de transições
        self.transition_frames = 0
        self.debounce_threshold = 1  # frames necessários para confirmar transição (reduzido para resposta imediata)
        
        # Estatísticas
        self.total_jumps = 0
        self.total_commands = 0
    
    def set_control_mode(self, mode: ControlMode):
        """
        Altera o modo de controle.
        
        Args:
            mode: Novo modo (DISCRETE ou CONTINUOUS)
        """
        self.config.control_mode = mode
        self.reset()
        print(f"[GESTURE] Modo alterado para: {mode.name}")
    
    def reset(self):
        """Reinicia o estado do mapeador."""
        self.current_state = GestureState.IDLE
        self.previous_hand_open = None
        self.smoothed_target_y = 0.5
        self.transition_frames = 0
    
    def _apply_dead_zone(self, value: float, center: float = 0.5) -> float:
        """
        Aplica zona morta para eliminar micro-movimentos.
        
        Args:
            value: Valor de entrada
            center: Centro da zona morta
            
        Returns:
            Valor após aplicação da zona morta
        """
        dead_zone = self.config.dead_zone
        
        if abs(value - center) < dead_zone:
            return center
        
        return value
    
    def _smooth_value(self, current: float, target: float) -> float:
        """
        Suaviza a transição entre valores usando interpolação linear.
        
        Args:
            current: Valor atual
            target: Valor alvo
            
        Returns:
            Valor suavizado
        """
        smoothing = self.config.continuous_smoothing
        return current + (target - current) * smoothing
    
    def _map_y_to_game(self, hand_y: float) -> float:
        """
        Mapeia a posição Y da mão para a posição no jogo.
        
        A câmera tem Y=0 no topo e Y=1 embaixo.
        O jogo tem Y=0 no topo e Y=screen_height embaixo.
        
        Args:
            hand_y: Posição Y da mão (0-1)
            
        Returns:
            Posição Y normalizada para o jogo (0-1)
        """
        # Limita range útil (evita bordas)
        min_y = 0.2
        max_y = 0.8
        
        # Clamp para range útil
        clamped_y = max(min_y, min(max_y, hand_y))
        
        # Normaliza para 0-1
        normalized = (clamped_y - min_y) / (max_y - min_y)
        
        # Inverte se configurado
        if self.config.invert_y:
            normalized = 1.0 - normalized
        
        return normalized
    
    def _process_discrete_mode(self, hand_data: HandData) -> GestureCommand:
        """
        Processa gesto no modo discreto (abrir/fechar mão).
        
        Detecta transição de fechada -> aberta para acionar pulo.
        
        Args:
            hand_data: Dados da mão
            
        Returns:
            Comando do gesto
        """
        command = GestureCommand(
            control_mode=ControlMode.DISCRETE,
            is_valid=hand_data.is_detected,
            raw_y=hand_data.raw_y,
            smoothed_y=hand_data.filtered_y,
        )
        
        if not hand_data.is_detected:
            command.hand_state = "not_detected"
            return command
        
        current_open = hand_data.is_open
        command.hand_state = "open" if current_open else "closed"
        
        # Detecta transição fechada -> aberta (pulo)
        should_jump = False
        
        if self.previous_hand_open is not None:
            # Transição de fechada para aberta
            if current_open and not self.previous_hand_open:
                self.transition_frames += 1
                
                if self.transition_frames >= self.debounce_threshold:
                    should_jump = True
                    self.total_jumps += 1
                    self.transition_frames = 0
            else:
                self.transition_frames = 0
        
        self.previous_hand_open = current_open
        
        command.should_jump = should_jump
        self.total_commands += 1
        
        return command
    
    def _process_continuous_mode(self, hand_data: HandData) -> GestureCommand:
        """
        Processa gesto no modo contínuo (altura da mão).
        
        A altura da mão determina diretamente a altura do pássaro.
        
        Args:
            hand_data: Dados da mão
            
        Returns:
            Comando do gesto
        """
        command = GestureCommand(
            control_mode=ControlMode.CONTINUOUS,
            is_valid=hand_data.is_detected,
            raw_y=hand_data.raw_y,
            smoothed_y=hand_data.filtered_y,
        )
        
        if hand_data.is_detected:
            command.hand_state = "tracking"
            
            # Mapeia Y da mão para Y do jogo
            target_y = self._map_y_to_game(hand_data.filtered_y)
            
            # Aplica zona morta
            target_y = self._apply_dead_zone(target_y, self.last_valid_y)
            
            # Suaviza movimento
            self.smoothed_target_y = self._smooth_value(
                self.smoothed_target_y, target_y
            )
            
            self.last_valid_y = self.smoothed_target_y
        else:
            command.hand_state = "lost"
            # Mantém última posição válida
        
        command.target_y = self.smoothed_target_y
        command.smoothed_y = self.smoothed_target_y
        self.total_commands += 1
        
        return command
    
    def process(self, hand_data: HandData) -> GestureCommand:
        """
        Processa dados da mão e gera comando apropriado.
        
        Seleciona automaticamente o processamento baseado
        no modo de controle configurado.
        
        Args:
            hand_data: Dados da mão detectada
            
        Returns:
            Comando do gesto para o jogo
        """
        if self.config.control_mode == ControlMode.DISCRETE:
            return self._process_discrete_mode(hand_data)
        else:
            return self._process_continuous_mode(hand_data)
    
    def get_mode_name(self) -> str:
        """Retorna nome amigável do modo atual."""
        if self.config.control_mode == ControlMode.DISCRETE:
            return "Discreto (Abrir/Fechar)"
        else:
            return "Contínuo (Altura)"
    
    def get_stats(self) -> dict:
        """
        Retorna estatísticas do mapeador.
        
        Returns:
            Dicionário com estatísticas
        """
        return {
            "mode": self.config.control_mode.name,
            "total_jumps": self.total_jumps,
            "total_commands": self.total_commands,
            "current_state": self.current_state.value,
        }


class GestureDebugger:
    """
    Classe auxiliar para debug de gestos.
    
    Fornece visualização e logging detalhado das
    interpretações de gestos.
    """
    
    def __init__(self, mapper: GestureMapper):
        """
        Inicializa o debugger.
        
        Args:
            mapper: Instância do GestureMapper a monitorar
        """
        self.mapper = mapper
        self.command_history: list = []
        self.max_history = 100
    
    def log_command(self, command: GestureCommand):
        """
        Registra um comando no histórico.
        
        Args:
            command: Comando a registrar
        """
        self.command_history.append({
            "should_jump": command.should_jump,
            "target_y": command.target_y,
            "hand_state": command.hand_state,
            "is_valid": command.is_valid,
        })
        
        # Limita histórico
        if len(self.command_history) > self.max_history:
            self.command_history.pop(0)
    
    def print_status(self, command: GestureCommand):
        """
        Imprime status atual no console.
        
        Args:
            command: Comando atual
        """
        mode = "DISC" if command.control_mode == ControlMode.DISCRETE else "CONT"
        
        if command.control_mode == ControlMode.DISCRETE:
            status = f"[{mode}] Mão: {command.hand_state:10s} | Jump: {command.should_jump}"
        else:
            status = f"[{mode}] Mão: {command.hand_state:10s} | Y: {command.target_y:.3f}"
        
        print(f"\r{status}", end="")
    
    def get_jump_rate(self) -> float:
        """
        Calcula taxa de pulos recentes.
        
        Returns:
            Taxa de pulos (0-1)
        """
        if not self.command_history:
            return 0.0
        
        jumps = sum(1 for c in self.command_history if c["should_jump"])
        return jumps / len(self.command_history)


# Exemplo de uso standalone
if __name__ == "__main__":
    print("=== Teste do Gesture Mapper ===")
    
    from hand_tracking import HandTracker
    import cv2
    
    # Inicializa componentes
    tracker = HandTracker()
    mapper = GestureMapper()
    debugger = GestureDebugger(mapper)
    
    print(f"Modo atual: {mapper.get_mode_name()}")
    print("Pressione 'M' para alternar modo, 'Q' para sair")
    
    if tracker.start():
        while True:
            frame, hand_data = tracker.process_frame()
            
            if frame is not None:
                # Processa gesto
                command = mapper.process(hand_data)
                
                # Debug
                debugger.log_command(command)
                debugger.print_status(command)
                
                # Desenha informações
                frame = tracker.draw_landmarks(frame, hand_data)
                
                # Adiciona info do comando
                h, w = frame.shape[:2]
                mode_text = f"Modo: {mapper.get_mode_name()}"
                cv2.putText(frame, mode_text, (10, h - 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                if command.control_mode == ControlMode.DISCRETE:
                    state_text = f"Estado: {command.hand_state} | Jump: {command.should_jump}"
                else:
                    state_text = f"Y Alvo: {command.target_y:.2f}"
                
                cv2.putText(frame, state_text, (10, h - 15),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                
                cv2.imshow("Gesture Mapping Test", frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                break
            elif key == ord('m'):
                # Alterna modo
                new_mode = (ControlMode.CONTINUOUS 
                           if mapper.config.control_mode == ControlMode.DISCRETE 
                           else ControlMode.DISCRETE)
                mapper.set_control_mode(new_mode)
        
        tracker.stop()
        cv2.destroyAllWindows()
        
        print("\n\n=== Estatísticas ===")
        print(mapper.get_stats())
