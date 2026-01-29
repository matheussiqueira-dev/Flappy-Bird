# Assets

Esta pasta contém recursos visuais e de áudio para o jogo.

## Estrutura planejada

```
assets/
├── images/
│   ├── bird.png
│   ├── pipe.png
│   ├── background.png
│   └── ground.png
├── sounds/
│   ├── jump.wav
│   ├── score.wav
│   └── hit.wav
└── demo.gif
```

## Nota

Atualmente o jogo usa gráficos gerados proceduralmente via Pygame.
Para adicionar sprites customizados, modifique as funções de desenho em `game_logic.py`.
