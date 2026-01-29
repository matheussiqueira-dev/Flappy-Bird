"""
Flappy Bird com Controle por Gestos - Loop Principal.

Este é o ponto de entrada da aplicação. Integra todos os módulos:
- Hand Tracking (detecção da mão via webcam)
- Gesture Mapping (interpretação dos gestos)
- Game Logic (motor do jogo)

Autor: Matheus Siqueira
Licença: MIT
"""

import sys
import os
import time
import cv2
import pygame
import numpy as np
from typing import Optional
from datetime import datetime

# Importa módulos do projeto
from config import (
    get_config, 
    set_control_mode, 
    toggle_debug,
    ControlMode,
    AppConfig
)
from hand_tracking import HandTracker, HandData
from gesture_mapping import GestureMapper, GestureCommand
from game_logic import FlappyBirdGame, GameState


class FlappyBirdGestureApp:
    """
    Aplicação principal do Flappy Bird com controle por gestos.
    
    Integra todos os componentes e gerencia o loop principal do jogo.
    """
    
    def __init__(self):
        """Inicializa a aplicação."""
        print("=" * 50)
        print("  FLAPPY BIRD - Controle por Gestos")
        print("=" * 50)
        
        # Carrega configurações
        self.config: AppConfig = get_config()
        
        # Inicializa componentes
        print("\n[INIT] Inicializando componentes...")
        
        self.hand_tracker = HandTracker(self.config.hand_tracking)
        self.gesture_mapper = GestureMapper(self.config.gesture)
        self.game = FlappyBirdGame(self.config.game)
        
        # Estado da aplicação
        self.running = True
        self.camera_window_visible = self.config.debug.show_camera_preview
        
        # Métricas
        self.frame_count = 0
        self.start_time = time.time()
        
        # Debug - exportação de frames
        if self.config.debug.export_frames:
            self._setup_frame_export()
        
        print("[INIT] Componentes inicializados com sucesso!")
        self._print_controls()
    
    def _setup_frame_export(self):
        """Configura diretório para exportação de frames."""
        export_path = self.config.debug.export_path
        if not os.path.exists(export_path):
            os.makedirs(export_path)
            print(f"[DEBUG] Diretório de exportação criado: {export_path}")
    
    def _print_controls(self):
        """Imprime controles disponíveis."""
        print("\n" + "=" * 50)
        print("  CONTROLES:")
        print("=" * 50)
        print("  M       - Alternar modo (Discreto/Contínuo)")
        print("  D       - Toggle modo debug")
        print("  C       - Toggle preview da câmera")
        print("  P       - Pausar jogo")
        print("  R       - Reiniciar jogo")
        print("  ESC/Q   - Sair")
        print("=" * 50)
        
        mode_name = self.gesture_mapper.get_mode_name()
        print(f"\n[INFO] Modo atual: {mode_name}")
        print("[INFO] Levante a mão para começar!\n")
    
    def start(self) -> bool:
        """
        Inicia a aplicação.
        
        Returns:
            True se iniciou com sucesso
        """
        # Inicia câmera
        if not self.hand_tracker.start():
            print("[ERRO] Falha ao iniciar câmera!")
            print("       Verifique se a webcam está conectada.")
            return False
        
        print("[OK] Câmera iniciada com sucesso!")
        
        # Cria janela da câmera se debug ativo
        if self.camera_window_visible:
            cv2.namedWindow("Hand Tracking", cv2.WINDOW_NORMAL)
            
            # Redimensiona janela
            preview_w = int(self.config.hand_tracking.camera_width * 
                          self.config.debug.camera_preview_scale)
            preview_h = int(self.config.hand_tracking.camera_height * 
                          self.config.debug.camera_preview_scale)
            cv2.resizeWindow("Hand Tracking", preview_w, preview_h)
        
        return True
    
    def _handle_pygame_events(self):
        """Processa eventos do Pygame."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            elif event.type == pygame.KEYDOWN:
                self._handle_keydown(event.key)
    
    def _handle_keydown(self, key: int):
        """
        Processa tecla pressionada.
        
        Args:
            key: Código da tecla
        """
        if key == pygame.K_ESCAPE or key == pygame.K_q:
            self.running = False
        
        elif key == pygame.K_m:
            # Alterna modo de controle
            current_mode = self.config.gesture.control_mode
            new_mode = (ControlMode.CONTINUOUS 
                       if current_mode == ControlMode.DISCRETE 
                       else ControlMode.DISCRETE)
            
            set_control_mode(new_mode)
            self.gesture_mapper.set_control_mode(new_mode)
            self.game.set_control_mode(new_mode)
            
            print(f"[MODO] Alterado para: {self.gesture_mapper.get_mode_name()}")
        
        elif key == pygame.K_d:
            toggle_debug()
            self.camera_window_visible = self.config.debug.show_camera_preview
            
            if not self.camera_window_visible:
                cv2.destroyWindow("Hand Tracking")
            else:
                cv2.namedWindow("Hand Tracking", cv2.WINDOW_NORMAL)
        
        elif key == pygame.K_c:
            self.camera_window_visible = not self.camera_window_visible
            if not self.camera_window_visible:
                cv2.destroyWindow("Hand Tracking")
            else:
                cv2.namedWindow("Hand Tracking", cv2.WINDOW_NORMAL)
        
        elif key == pygame.K_p:
            if self.game.state == GameState.PLAYING:
                self.game.pause_game()
            elif self.game.state == GameState.PAUSED:
                self.game.resume_game()
        
        elif key == pygame.K_r:
            self.game.start_game()
    
    def _handle_opencv_keys(self):
        """Processa teclas do OpenCV."""
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            self.running = False
        elif key == ord('m'):
            self._handle_keydown(pygame.K_m)
        elif key == ord('d'):
            self._handle_keydown(pygame.K_d)
    
    def _process_hand_input(self) -> tuple:
        """
        Processa input da mão.
        
        Returns:
            Tuple (frame, hand_data, gesture_command)
        """
        # Captura e processa frame
        frame, hand_data = self.hand_tracker.process_frame()
        
        # Mapeia gesto
        command = self.gesture_mapper.process(hand_data)
        
        return frame, hand_data, command
    
    def _update_game_state(self, command: GestureCommand, hand_data: HandData):
        """
        Atualiza estado do jogo baseado no comando.
        
        Args:
            command: Comando do gesto
            hand_data: Dados da mão
        """
        # Menu - inicia com mão detectada e aberta
        if self.game.state == GameState.MENU:
            if hand_data.is_detected and hand_data.is_open:
                self.game.start_game()
        
        # Game Over - reinicia com mão aberta
        elif self.game.state == GameState.GAME_OVER:
            if command.should_jump or (hand_data.is_detected and hand_data.is_open):
                self.game.start_game()
        
        # Jogando
        elif self.game.state == GameState.PLAYING:
            if self.config.gesture.control_mode == ControlMode.DISCRETE:
                self.game.update(should_jump=command.should_jump)
            else:
                self.game.update(target_y=command.target_y)
    
    def _render_camera_preview(self, frame: np.ndarray, hand_data: HandData):
        """
        Renderiza preview da câmera.
        
        Args:
            frame: Frame da câmera
            hand_data: Dados da mão
        """
        if frame is None or not self.camera_window_visible:
            return
        
        # Desenha landmarks e info
        frame = self.hand_tracker.draw_landmarks(frame, hand_data)
        
        if self.config.debug.enabled:
            frame = self.hand_tracker.draw_debug_info(frame, hand_data)
        
        # Adiciona informações do modo
        h, w = frame.shape[:2]
        mode_text = f"Modo: {self.gesture_mapper.get_mode_name()}"
        cv2.putText(
            frame, mode_text, (10, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
        )
        
        cv2.imshow("Hand Tracking", frame)
    
    def _render_game(self, hand_data: HandData, command: GestureCommand):
        """
        Renderiza o jogo.
        
        Args:
            hand_data: Dados da mão
            command: Comando do gesto
        """
        # Desenha jogo
        self.game.draw()
        
        # Overlay de debug
        if self.config.debug.enabled:
            self.game.draw_debug_overlay(
                hand_detected=hand_data.is_detected,
                hand_y=command.smoothed_y,
                hand_open=hand_data.is_open,
                fps=self.hand_tracker.get_fps(),
                confidence=hand_data.confidence
            )
            
            # Atualiza display após overlay
            pygame.display.flip()
    
    def _export_debug_frame(self, frame: np.ndarray, hand_data: HandData):
        """
        Exporta frame para debug.
        
        Args:
            frame: Frame a exportar
            hand_data: Dados da mão
        """
        if not self.config.debug.export_frames or frame is None:
            return
        
        if self.frame_count % 30 == 0:  # A cada 30 frames
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"{self.config.debug.export_path}/frame_{timestamp}.jpg"
            cv2.imwrite(filename, frame)
    
    def _print_debug_info(self, hand_data: HandData, command: GestureCommand):
        """
        Imprime informações de debug no console.
        
        Args:
            hand_data: Dados da mão
            command: Comando do gesto
        """
        if not self.config.debug.enabled:
            return
        
        # Imprime a cada 30 frames para não poluir
        if self.frame_count % 30 != 0:
            return
        
        debug_parts = []
        
        if self.config.debug.print_fps:
            debug_parts.append(f"FPS: {self.hand_tracker.get_fps():.1f}")
        
        if self.config.debug.print_hand_position:
            debug_parts.append(f"Y: {command.smoothed_y:.3f}")
        
        if self.config.debug.print_confidence:
            debug_parts.append(f"Conf: {hand_data.confidence:.2f}")
        
        debug_parts.append(f"Estado: {command.hand_state}")
        debug_parts.append(f"Score: {self.game.stats.score}")
        
        debug_str = " | ".join(debug_parts)
        print(f"\r[DEBUG] {debug_str}", end="")
    
    def run(self):
        """
        Loop principal da aplicação.
        
        Executa continuamente:
        1. Processa eventos
        2. Captura e processa mão
        3. Atualiza jogo
        4. Renderiza
        """
        print("\n[RUN] Iniciando loop principal...")
        
        while self.running:
            self.frame_count += 1
            
            # Processa eventos
            self._handle_pygame_events()
            self._handle_opencv_keys()
            
            # Processa input da mão
            frame, hand_data, command = self._process_hand_input()
            
            # Atualiza jogo
            self._update_game_state(command, hand_data)
            
            # Renderiza câmera
            self._render_camera_preview(frame, hand_data)
            
            # Renderiza jogo
            self._render_game(hand_data, command)
            
            # Debug
            self._print_debug_info(hand_data, command)
            self._export_debug_frame(frame, hand_data)
            
            # Controle de FPS
            self.game.tick()
    
    def cleanup(self):
        """Limpa recursos ao finalizar."""
        print("\n\n[CLEANUP] Encerrando aplicação...")
        
        # Para câmera
        self.hand_tracker.stop()
        
        # Fecha janelas OpenCV
        cv2.destroyAllWindows()
        
        # Fecha Pygame
        self.game.quit()
        
        # Estatísticas finais
        elapsed = time.time() - self.start_time
        print("\n" + "=" * 50)
        print("  ESTATÍSTICAS DA SESSÃO:")
        print("=" * 50)
        print(f"  Tempo total: {elapsed:.1f} segundos")
        print(f"  Frames processados: {self.frame_count}")
        print(f"  FPS médio: {self.frame_count / elapsed:.1f}")
        print(f"  Jogos jogados: {self.game.stats.total_games}")
        print(f"  Maior pontuação: {self.game.stats.high_score}")
        print(f"  Total de pulos: {self.game.stats.total_jumps}")
        print("=" * 50)
        print("\nObrigado por jogar! 🐦")


def main():
    """
    Ponto de entrada principal da aplicação.
    
    Inicializa e executa o Flappy Bird com controle por gestos.
    """
    app = FlappyBirdGestureApp()
    
    try:
        if app.start():
            app.run()
    except KeyboardInterrupt:
        print("\n[INFO] Interrompido pelo usuário")
    except Exception as e:
        print(f"\n[ERRO] Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
    finally:
        app.cleanup()


if __name__ == "__main__":
    main()
