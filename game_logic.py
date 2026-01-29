"""
Motor do Jogo Flappy Bird.

Implementa toda a lógica do jogo, incluindo física,
colisões, pontuação e gerenciamento de estado.
"""

import pygame
import random
import math
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum

from config import GameConfig, ControlMode, get_config


class GameState(Enum):
    """Estados possíveis do jogo."""
    MENU = "menu"
    PLAYING = "playing"
    PAUSED = "paused"
    GAME_OVER = "game_over"


@dataclass
class Bird:
    """
    Representa o pássaro do jogador.
    
    Attributes:
        x: Posição X (fixa)
        y: Posição Y (varia)
        velocity_y: Velocidade vertical
        size: Tamanho do pássaro
        angle: Ângulo de rotação
        alive: Se está vivo
    """
    x: float
    y: float
    velocity_y: float = 0.0
    size: int = 30
    angle: float = 0.0
    alive: bool = True
    
    # Animação
    animation_frame: int = 0
    animation_timer: int = 0
    
    def get_rect(self) -> pygame.Rect:
        """Retorna retângulo de colisão."""
        return pygame.Rect(
            self.x - self.size // 2,
            self.y - self.size // 2,
            self.size,
            self.size
        )
    
    def get_center(self) -> Tuple[int, int]:
        """Retorna centro do pássaro."""
        return (int(self.x), int(self.y))


@dataclass
class Pipe:
    """
    Representa um par de canos (obstáculos).
    
    Attributes:
        x: Posição X
        gap_y: Centro do gap entre canos
        gap_size: Tamanho do gap
        width: Largura do cano
        passed: Se o pássaro já passou
        scored: Se já foi pontuado
    """
    x: float
    gap_y: float
    gap_size: int
    width: int
    passed: bool = False
    scored: bool = False
    
    def get_top_rect(self, screen_height: int) -> pygame.Rect:
        """Retorna retângulo do cano superior."""
        top_height = self.gap_y - self.gap_size // 2
        return pygame.Rect(self.x, 0, self.width, top_height)
    
    def get_bottom_rect(self, screen_height: int, ground_height: int) -> pygame.Rect:
        """Retorna retângulo do cano inferior."""
        bottom_y = self.gap_y + self.gap_size // 2
        bottom_height = screen_height - bottom_y - ground_height
        return pygame.Rect(self.x, bottom_y, self.width, bottom_height)


@dataclass
class GameStats:
    """Estatísticas do jogo."""
    score: int = 0
    high_score: int = 0
    total_games: int = 0
    total_jumps: int = 0
    distance_traveled: float = 0.0
    time_alive: float = 0.0


class FlappyBirdGame:
    """
    Classe principal do motor do jogo Flappy Bird.
    
    Gerencia toda a lógica do jogo, física, colisões e renderização.
    """
    
    def __init__(self, config: Optional[GameConfig] = None):
        """
        Inicializa o motor do jogo.
        
        Args:
            config: Configurações do jogo (usa padrão se None)
        """
        self.config = config or get_config().game
        
        # Estado do jogo
        self.state = GameState.MENU
        self.stats = GameStats()
        
        # Objetos do jogo
        self.bird: Optional[Bird] = None
        self.pipes: List[Pipe] = []
        
        # Timers
        self.pipe_spawn_timer = 0
        self.frame_count = 0
        
        # Modo de controle atual
        self.control_mode = get_config().gesture.control_mode
        
        # Inicializa Pygame
        pygame.init()
        
        # Cria tela
        self.screen = pygame.display.set_mode(
            (self.config.screen_width, self.config.screen_height)
        )
        pygame.display.set_caption("Flappy Bird - Controle por Gestos")
        
        # Clock para FPS
        self.clock = pygame.time.Clock()
        
        # Fontes
        self.font_large = pygame.font.Font(None, 72)
        self.font_medium = pygame.font.Font(None, 48)
        self.font_small = pygame.font.Font(None, 32)
        
        # Cores
        self.colors = {
            "sky": self.config.background_color,
            "ground": self.config.ground_color,
            "bird": self.config.bird_color,
            "pipe": self.config.pipe_color,
            "pipe_border": (0, 150, 0),
            "text": (255, 255, 255),
            "shadow": (0, 0, 0),
        }
        
        # Inicializa jogo
        self._init_game()
    
    def _init_game(self):
        """Inicializa/reinicia estado do jogo."""
        # Cria pássaro no centro vertical
        start_y = self.config.screen_height // 2
        self.bird = Bird(
            x=self.config.bird_x,
            y=start_y,
            size=self.config.bird_size
        )
        
        # Limpa canos
        self.pipes = []
        self.pipe_spawn_timer = 0
        
        # Reset timers
        self.frame_count = 0
        
        # Reset score (mantém high score)
        self.stats.score = 0
        self.stats.time_alive = 0.0
    
    def start_game(self):
        """Inicia uma nova partida."""
        self._init_game()
        self.state = GameState.PLAYING
        self.stats.total_games += 1
    
    def pause_game(self):
        """Pausa o jogo."""
        if self.state == GameState.PLAYING:
            self.state = GameState.PAUSED
    
    def resume_game(self):
        """Retoma o jogo pausado."""
        if self.state == GameState.PAUSED:
            self.state = GameState.PLAYING
    
    def game_over(self):
        """Finaliza a partida."""
        self.state = GameState.GAME_OVER
        self.bird.alive = False
        
        # Atualiza high score
        if self.stats.score > self.stats.high_score:
            self.stats.high_score = self.stats.score
    
    def set_control_mode(self, mode: ControlMode):
        """Define o modo de controle."""
        self.control_mode = mode
    
    def _spawn_pipe(self):
        """Gera um novo par de canos."""
        # Gap aleatório com margem
        min_gap_y = self.config.pipe_gap // 2 + 50
        max_gap_y = (self.config.screen_height - self.config.ground_height - 
                     self.config.pipe_gap // 2 - 50)
        
        gap_y = random.randint(min_gap_y, max_gap_y)
        
        pipe = Pipe(
            x=self.config.screen_width + 10,
            gap_y=gap_y,
            gap_size=self.config.pipe_gap,
            width=self.config.pipe_width
        )
        
        self.pipes.append(pipe)
    
    def _update_physics_discrete(self, should_jump: bool):
        """
        Atualiza física no modo discreto (gravidade + pulo).
        
        Args:
            should_jump: Se deve pular
        """
        if should_jump:
            self.bird.velocity_y = self.config.jump_strength
            self.stats.total_jumps += 1
        
        # Aplica gravidade
        self.bird.velocity_y += self.config.gravity
        
        # Limita velocidade de queda
        if self.bird.velocity_y > self.config.max_fall_speed:
            self.bird.velocity_y = self.config.max_fall_speed
        
        # Atualiza posição
        self.bird.y += self.bird.velocity_y
        
        # Atualiza ângulo baseado na velocidade
        target_angle = -self.bird.velocity_y * 3
        target_angle = max(-30, min(60, target_angle))
        self.bird.angle += (target_angle - self.bird.angle) * 0.1
    
    def _update_physics_continuous(self, target_y: float):
        """
        Atualiza física no modo contínuo (posição direta).
        
        Args:
            target_y: Posição Y alvo normalizada (0-1)
        """
        # Calcula posição Y alvo em pixels
        min_y = self.config.bird_size
        max_y = self.config.screen_height - self.config.ground_height - self.config.bird_size
        
        target_pixel_y = min_y + target_y * (max_y - min_y)
        
        # Interpolação suave
        smoothing = 0.15
        self.bird.y += (target_pixel_y - self.bird.y) * smoothing
        
        # Calcula "velocidade aparente" para ângulo
        apparent_velocity = (target_pixel_y - self.bird.y) * 0.5
        
        target_angle = -apparent_velocity * 2
        target_angle = max(-20, min(30, target_angle))
        self.bird.angle += (target_angle - self.bird.angle) * 0.2
    
    def _update_pipes(self):
        """Atualiza posição e estado dos canos."""
        pipes_to_remove = []
        
        for pipe in self.pipes:
            # Move cano para esquerda
            pipe.x -= self.config.pipe_speed
            
            # Verifica se passou do pássaro
            if not pipe.scored and pipe.x + pipe.width < self.bird.x:
                pipe.scored = True
                self.stats.score += 1
            
            # Marca para remoção se saiu da tela
            if pipe.x + pipe.width < 0:
                pipes_to_remove.append(pipe)
        
        # Remove canos fora da tela
        for pipe in pipes_to_remove:
            self.pipes.remove(pipe)
    
    def _check_collisions(self) -> bool:
        """
        Verifica colisões do pássaro.
        
        Returns:
            True se houve colisão
        """
        bird_rect = self.bird.get_rect()
        
        # Colisão com teto
        if self.bird.y - self.bird.size // 2 <= 0:
            return True
        
        # Colisão com chão
        ground_y = self.config.screen_height - self.config.ground_height
        if self.bird.y + self.bird.size // 2 >= ground_y:
            return True
        
        # Colisão com canos
        for pipe in self.pipes:
            top_rect = pipe.get_top_rect(self.config.screen_height)
            bottom_rect = pipe.get_bottom_rect(
                self.config.screen_height, 
                self.config.ground_height
            )
            
            if bird_rect.colliderect(top_rect) or bird_rect.colliderect(bottom_rect):
                return True
        
        return False
    
    def update(self, should_jump: bool = False, target_y: float = 0.5):
        """
        Atualiza estado do jogo para um frame.
        
        Args:
            should_jump: Se o pássaro deve pular (modo discreto)
            target_y: Posição Y alvo (modo contínuo)
        """
        if self.state != GameState.PLAYING:
            return
        
        self.frame_count += 1
        self.stats.time_alive += 1 / self.config.target_fps
        self.stats.distance_traveled += self.config.pipe_speed
        
        # Atualiza física baseado no modo
        if self.control_mode == ControlMode.DISCRETE:
            self._update_physics_discrete(should_jump)
        else:
            self._update_physics_continuous(target_y)
        
        # Spawn de canos
        self.pipe_spawn_timer += 1
        if self.pipe_spawn_timer >= self.config.pipe_spawn_interval:
            self._spawn_pipe()
            self.pipe_spawn_timer = 0
        
        # Atualiza canos
        self._update_pipes()
        
        # Verifica colisões
        if self._check_collisions():
            self.game_over()
        
        # Animação do pássaro
        self.bird.animation_timer += 1
        if self.bird.animation_timer >= 5:
            self.bird.animation_timer = 0
            self.bird.animation_frame = (self.bird.animation_frame + 1) % 3
    
    def _draw_background(self):
        """Desenha fundo do jogo."""
        self.screen.fill(self.colors["sky"])
        
        # Nuvens decorativas (simples)
        cloud_y = 80
        for i in range(3):
            cloud_x = ((self.frame_count // 2 + i * 200) % 
                      (self.config.screen_width + 100)) - 50
            pygame.draw.ellipse(
                self.screen, (255, 255, 255),
                (cloud_x, cloud_y + i * 60, 80, 40)
            )
    
    def _draw_ground(self):
        """Desenha chão."""
        ground_y = self.config.screen_height - self.config.ground_height
        
        # Chão principal
        pygame.draw.rect(
            self.screen,
            self.colors["ground"],
            (0, ground_y, self.config.screen_width, self.config.ground_height)
        )
        
        # Grama no topo
        pygame.draw.rect(
            self.screen,
            (100, 200, 100),
            (0, ground_y, self.config.screen_width, 10)
        )
    
    def _draw_bird(self):
        """Desenha o pássaro."""
        if self.bird is None:
            return
        
        center = self.bird.get_center()
        size = self.bird.size
        
        # Corpo (elipse rotacionada simplificada como círculo)
        body_color = self.colors["bird"]
        pygame.draw.circle(self.screen, body_color, center, size // 2)
        
        # Borda
        pygame.draw.circle(self.screen, (200, 150, 0), center, size // 2, 2)
        
        # Olho
        eye_offset = 5
        eye_x = center[0] + eye_offset
        eye_y = center[1] - 5
        pygame.draw.circle(self.screen, (255, 255, 255), (eye_x, eye_y), 6)
        pygame.draw.circle(self.screen, (0, 0, 0), (eye_x + 2, eye_y), 3)
        
        # Bico
        beak_points = [
            (center[0] + size // 2, center[1]),
            (center[0] + size // 2 + 10, center[1] + 3),
            (center[0] + size // 2, center[1] + 6),
        ]
        pygame.draw.polygon(self.screen, (255, 150, 0), beak_points)
        
        # Asa (animada)
        wing_y_offset = [-3, 0, 3][self.bird.animation_frame]
        wing_rect = (
            center[0] - size // 3,
            center[1] + wing_y_offset,
            size // 2,
            size // 4
        )
        pygame.draw.ellipse(self.screen, (220, 200, 0), wing_rect)
    
    def _draw_pipes(self):
        """Desenha todos os canos."""
        for pipe in self.pipes:
            # Cano superior
            top_rect = pipe.get_top_rect(self.config.screen_height)
            pygame.draw.rect(self.screen, self.colors["pipe"], top_rect)
            pygame.draw.rect(self.screen, self.colors["pipe_border"], top_rect, 3)
            
            # Borda inferior do cano superior
            cap_rect = pygame.Rect(
                pipe.x - 5,
                top_rect.height - 30,
                pipe.width + 10,
                30
            )
            pygame.draw.rect(self.screen, self.colors["pipe"], cap_rect)
            pygame.draw.rect(self.screen, self.colors["pipe_border"], cap_rect, 3)
            
            # Cano inferior
            bottom_rect = pipe.get_bottom_rect(
                self.config.screen_height,
                self.config.ground_height
            )
            pygame.draw.rect(self.screen, self.colors["pipe"], bottom_rect)
            pygame.draw.rect(self.screen, self.colors["pipe_border"], bottom_rect, 3)
            
            # Borda superior do cano inferior
            cap_rect_bottom = pygame.Rect(
                pipe.x - 5,
                bottom_rect.y,
                pipe.width + 10,
                30
            )
            pygame.draw.rect(self.screen, self.colors["pipe"], cap_rect_bottom)
            pygame.draw.rect(self.screen, self.colors["pipe_border"], cap_rect_bottom, 3)
    
    def _draw_score(self):
        """Desenha pontuação."""
        # Score atual
        score_text = self.font_large.render(str(self.stats.score), True, self.colors["text"])
        score_shadow = self.font_large.render(str(self.stats.score), True, self.colors["shadow"])
        
        x = self.config.screen_width // 2 - score_text.get_width() // 2
        y = 50
        
        self.screen.blit(score_shadow, (x + 2, y + 2))
        self.screen.blit(score_text, (x, y))
    
    def _draw_menu(self):
        """Desenha tela de menu."""
        self._draw_background()
        self._draw_ground()
        
        # Título
        title = self.font_large.render("FLAPPY BIRD", True, self.colors["text"])
        subtitle = self.font_medium.render("Controle por Gestos", True, (255, 255, 0))
        
        title_x = self.config.screen_width // 2 - title.get_width() // 2
        self.screen.blit(title, (title_x, 150))
        
        subtitle_x = self.config.screen_width // 2 - subtitle.get_width() // 2
        self.screen.blit(subtitle, (subtitle_x, 220))
        
        # Modo atual
        mode_name = "Discreto" if self.control_mode == ControlMode.DISCRETE else "Contínuo"
        mode_text = self.font_small.render(f"Modo: {mode_name}", True, (200, 200, 200))
        mode_x = self.config.screen_width // 2 - mode_text.get_width() // 2
        self.screen.blit(mode_text, (mode_x, 280))
        
        # Instruções
        if self.control_mode == ControlMode.DISCRETE:
            inst = "Abra a mão para pular!"
        else:
            inst = "Mova a mão para controlar!"
        
        inst_text = self.font_small.render(inst, True, (255, 255, 255))
        inst_x = self.config.screen_width // 2 - inst_text.get_width() // 2
        self.screen.blit(inst_text, (inst_x, 350))
        
        # High score
        if self.stats.high_score > 0:
            hs_text = self.font_small.render(
                f"Recorde: {self.stats.high_score}", 
                True, (255, 215, 0)
            )
            hs_x = self.config.screen_width // 2 - hs_text.get_width() // 2
            self.screen.blit(hs_text, (hs_x, 420))
        
        # Pressione para iniciar
        blink = (self.frame_count // 30) % 2 == 0
        if blink:
            start_text = self.font_small.render(
                "Levante a mão para começar", 
                True, (255, 255, 255)
            )
            start_x = self.config.screen_width // 2 - start_text.get_width() // 2
            self.screen.blit(start_text, (start_x, 500))
    
    def _draw_game_over(self):
        """Desenha tela de game over."""
        # Semi-transparente sobre o jogo
        overlay = pygame.Surface(
            (self.config.screen_width, self.config.screen_height)
        )
        overlay.fill((0, 0, 0))
        overlay.set_alpha(150)
        self.screen.blit(overlay, (0, 0))
        
        # Game Over
        go_text = self.font_large.render("GAME OVER", True, (255, 50, 50))
        go_x = self.config.screen_width // 2 - go_text.get_width() // 2
        self.screen.blit(go_text, (go_x, 180))
        
        # Score
        score_label = self.font_medium.render("Pontuação", True, (255, 255, 255))
        score_x = self.config.screen_width // 2 - score_label.get_width() // 2
        self.screen.blit(score_label, (score_x, 270))
        
        score_text = self.font_large.render(str(self.stats.score), True, (255, 255, 0))
        score_x = self.config.screen_width // 2 - score_text.get_width() // 2
        self.screen.blit(score_text, (score_x, 310))
        
        # High Score
        if self.stats.score >= self.stats.high_score:
            new_record = self.font_small.render("NOVO RECORDE!", True, (255, 215, 0))
            nr_x = self.config.screen_width // 2 - new_record.get_width() // 2
            self.screen.blit(new_record, (nr_x, 380))
        
        # Instrução
        blink = (self.frame_count // 30) % 2 == 0
        if blink:
            restart_text = self.font_small.render(
                "Abra a mão para reiniciar",
                True, (255, 255, 255)
            )
            restart_x = self.config.screen_width // 2 - restart_text.get_width() // 2
            self.screen.blit(restart_text, (restart_x, 450))
    
    def _draw_paused(self):
        """Desenha tela de pausa."""
        overlay = pygame.Surface(
            (self.config.screen_width, self.config.screen_height)
        )
        overlay.fill((0, 0, 0))
        overlay.set_alpha(100)
        self.screen.blit(overlay, (0, 0))
        
        pause_text = self.font_large.render("PAUSADO", True, (255, 255, 255))
        pause_x = self.config.screen_width // 2 - pause_text.get_width() // 2
        pause_y = self.config.screen_height // 2 - pause_text.get_height() // 2
        self.screen.blit(pause_text, (pause_x, pause_y))
    
    def draw(self):
        """Renderiza frame atual do jogo."""
        if self.state == GameState.MENU:
            self._draw_menu()
        else:
            # Fundo
            self._draw_background()
            
            # Canos
            self._draw_pipes()
            
            # Chão
            self._draw_ground()
            
            # Pássaro
            self._draw_bird()
            
            # Score
            self._draw_score()
            
            # Overlays de estado
            if self.state == GameState.GAME_OVER:
                self._draw_game_over()
            elif self.state == GameState.PAUSED:
                self._draw_paused()
        
        # Atualiza display
        pygame.display.flip()
    
    def draw_debug_overlay(self, hand_detected: bool, hand_y: float, 
                          hand_open: bool, fps: float, confidence: float):
        """
        Desenha overlay de debug.
        
        Args:
            hand_detected: Se mão foi detectada
            hand_y: Posição Y da mão
            hand_open: Se mão está aberta
            fps: FPS da câmera
            confidence: Confiança da detecção
        """
        # Painel de debug
        panel_rect = pygame.Rect(5, 5, 150, 130)
        pygame.draw.rect(self.screen, (0, 0, 0, 180), panel_rect)
        pygame.draw.rect(self.screen, (100, 100, 100), panel_rect, 1)
        
        # Informações
        y_offset = 15
        
        # Status da mão
        status_color = (0, 255, 0) if hand_detected else (255, 0, 0)
        status = "Detectada" if hand_detected else "Não detectada"
        status_text = self.font_small.render(f"Mão: {status}", True, status_color)
        self.screen.blit(status_text, (10, y_offset))
        y_offset += 22
        
        # Estado
        if hand_detected:
            state = "Aberta" if hand_open else "Fechada"
            state_text = self.font_small.render(f"Estado: {state}", True, (255, 255, 255))
            self.screen.blit(state_text, (10, y_offset))
            y_offset += 22
        
        # Posição Y
        y_text = self.font_small.render(f"Y: {hand_y:.2f}", True, (255, 255, 255))
        self.screen.blit(y_text, (10, y_offset))
        y_offset += 22
        
        # Confiança
        conf_text = self.font_small.render(f"Conf: {confidence:.2f}", True, (255, 255, 255))
        self.screen.blit(conf_text, (10, y_offset))
        y_offset += 22
        
        # FPS
        fps_text = self.font_small.render(f"FPS: {fps:.1f}", True, (255, 255, 255))
        self.screen.blit(fps_text, (10, y_offset))
        
        # Indicador visual da mão à direita
        indicator_x = self.config.screen_width - 50
        indicator_y = int(hand_y * (self.config.screen_height - 100)) + 50
        
        indicator_color = (0, 255, 0) if hand_detected else (100, 100, 100)
        radius = 20 if hand_open else 10
        
        pygame.draw.circle(self.screen, indicator_color, (indicator_x, indicator_y), radius)
        pygame.draw.circle(self.screen, (255, 255, 255), (indicator_x, indicator_y), radius, 2)
    
    def get_screen(self) -> pygame.Surface:
        """Retorna superfície da tela."""
        return self.screen
    
    def tick(self) -> float:
        """
        Controla FPS e retorna delta time.
        
        Returns:
            Tempo desde último frame em segundos
        """
        return self.clock.tick(self.config.target_fps) / 1000.0
    
    def quit(self):
        """Finaliza Pygame."""
        pygame.quit()


# Teste standalone
if __name__ == "__main__":
    print("=== Teste do Motor do Jogo ===")
    print("Controles: ESPAÇO = pular, ESC = sair, P = pausar")
    
    game = FlappyBirdGame()
    running = True
    
    while running:
        # Eventos
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_SPACE:
                    if game.state == GameState.MENU:
                        game.start_game()
                    elif game.state == GameState.GAME_OVER:
                        game.start_game()
                    elif game.state == GameState.PLAYING:
                        game.update(should_jump=True)
                elif event.key == pygame.K_p:
                    if game.state == GameState.PLAYING:
                        game.pause_game()
                    elif game.state == GameState.PAUSED:
                        game.resume_game()
        
        # Atualiza (sem pulo automático)
        if game.state == GameState.PLAYING:
            keys = pygame.key.get_pressed()
            game.update(should_jump=False)
        
        game.frame_count += 1
        
        # Renderiza
        game.draw()
        
        # FPS
        game.tick()
    
    game.quit()
    print("Jogo encerrado!")
