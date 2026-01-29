# 🐦 Flappy Bird - Controle por Gestos

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange.svg)](https://mediapipe.dev)
[![Pygame](https://img.shields.io/badge/Pygame-2.x-red.svg)](https://pygame.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <img src="assets/demo.gif" alt="Demo do Jogo" width="600">
</p>

> **Jogue Flappy Bird usando apenas sua mão no ar!** Um projeto interativo que combina visão computacional com gameplay clássico, permitindo controlar o jogo através de gestos captados pela webcam.

---

## 📖 Índice

- [Introdução](#-introdução)
- [Como Funciona](#-como-funciona)
- [Recursos](#-recursos)
- [Instalação](#-instalação)
- [Como Jogar](#-como-jogar)
- [Modos de Controle](#-modos-de-controle)
- [Configurações](#-configurações)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Contribuição](#-contribuição)
- [Roadmap](#-roadmap)
- [Licença](#-licença)

---

## 🎯 Introdução

Este projeto reimagina o clássico **Flappy Bird** com uma interface de controle inovadora: **seus gestos**! Usando a webcam do computador e técnicas de visão computacional, o jogo detecta a posição e o estado da sua mão em tempo real, transformando movimentos físicos em comandos do jogo.

### Por que este projeto?

- 🎮 **Interação Natural**: Jogue sem tocar em nenhum dispositivo
- 🧠 **Tecnologia Moderna**: Demonstra aplicação prática de ML/CV
- 📚 **Educacional**: Código limpo e bem documentado para aprendizado
- 🎪 **Demonstração**: Perfeito para apresentações e eventos

---

## 🔬 Como Funciona

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│   Webcam    │────▶│ Hand Tracker │────▶│ Gesture Mapper  │────▶│   Game     │
│             │     │ (MediaPipe)  │     │ (Interpretação) │     │  (Pygame)  │
└─────────────┘     └──────────────┘     └─────────────────┘     └────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │ 21 Landmarks │     │ Comando (Pular/ │
                    │ da Mão       │     │ Posição Y)      │
                    └──────────────┘     └─────────────────┘
```

1. **Captura de Vídeo**: A webcam captura frames em tempo real
2. **Detecção de Mão**: MediaPipe Hands identifica 21 pontos (landmarks) da mão
3. **Filtro Temporal**: Média móvel suaviza as coordenadas, eliminando tremores
4. **Interpretação de Gesto**: Analisa se a mão está aberta/fechada ou sua altura
5. **Comando do Jogo**: Traduz gesto em ação (pular ou posicionar pássaro)
6. **Renderização**: Pygame exibe o jogo com feedback visual em tempo real

---

## ✨ Recursos

### Gameplay
- 🎮 Mecânica fiel ao Flappy Bird original
- 🏆 Sistema de pontuação e high score
- 🔄 Reinício rápido após game over

### Controle por Gestos
- ✋ **Modo Discreto**: Abra a mão para pular, feche para cair
- 📏 **Modo Contínuo**: A altura da sua mão controla a altura do pássaro
- 🎯 Filtro temporal para movimentos suaves
- 🔄 Troca de modo em tempo real (tecla M)

### Debug e Desenvolvimento
- 📊 Display de FPS e confiança da detecção
- 👁️ Preview da câmera com landmarks
- 📤 Exportação de frames para análise
- 🔧 Configurações centralizadas e fáceis de ajustar

---

## 🚀 Instalação

### Pré-requisitos

- Python 3.8 ou superior
- Webcam funcional
- Sistema operacional: Windows, macOS ou Linux

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/matheussiqueira-dev/Flapy-Bird.git
   cd Flapy-Bird
   ```

2. **Crie um ambiente virtual** (recomendado)
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute o jogo**
   ```bash
   python main.py
   ```

---

## 🎮 Como Jogar

### Iniciando
1. Execute `python main.py`
2. Posicione-se em frente à webcam (distância de 50-100cm)
3. Levante uma mão para o jogo detectar
4. **Abra a mão** para iniciar o jogo

### Controles

| Tecla | Ação |
|-------|------|
| `M` | Alternar modo de controle |
| `D` | Toggle modo debug |
| `C` | Mostrar/ocultar preview da câmera |
| `P` | Pausar/retomar jogo |
| `R` | Reiniciar jogo |
| `ESC` / `Q` | Sair |

### Dicas
- 🌞 Boa iluminação melhora a detecção
- 📏 Mantenha a mão a uma distância confortável
- 🖐️ Use gestos claros e definidos
- 🎯 No modo contínuo, movimentos suaves são melhores

---

## 🕹️ Modos de Controle

### Modo 1: Discreto (Padrão)

```
    ✋ MÃO ABERTA          ✊ MÃO FECHADA
    ───────────────       ───────────────
    │   PULAR!    │       │   Gravidade │
    │     ⬆️       │       │     ⬇️       │
    ───────────────       ───────────────
```

- **Abrir a mão** → Pássaro pula (impulso para cima)
- **Fechar a mão** → Pássaro cai naturalmente (gravidade)
- Similar ao controle original com cliques

### Modo 2: Contínuo

```
         MÃO ALTA              MÃO BAIXA
    ┌─────────────────┐   ┌─────────────────┐
    │       ✋         │   │                 │
    │      🐦         │   │      🐦         │
    │                 │   │       ✋         │
    └─────────────────┘   └─────────────────┘
         Pássaro alto        Pássaro baixo
```

- A **altura da mão** controla diretamente a **altura do pássaro**
- Movimento suave com interpolação
- Controle mais preciso, mas requer prática

---

## ⚙️ Configurações

Todas as configurações estão centralizadas em `config.py`:

### Modo de Controle
```python
# No arquivo config.py, altere:
gesture=GestureConfig(
    control_mode=ControlMode.DISCRETE,  # ou CONTINUOUS
)
```

### Física do Jogo
```python
game=GameConfig(
    gravity=0.5,           # Força da gravidade
    jump_strength=-10.0,   # Força do pulo
    pipe_gap=180,          # Espaço entre canos
    pipe_speed=3.0,        # Velocidade dos canos
)
```

### Detecção de Mão
```python
hand_tracking=HandTrackingConfig(
    min_detection_confidence=0.7,  # Confiança mínima
    smoothing_window_size=5,       # Suavização (anti-jitter)
)
```

### Debug
```python
debug=DebugConfig(
    enabled=True,              # Ativar debug
    show_camera_preview=True,  # Mostrar câmera
    export_frames=False,       # Salvar frames
)
```

---

## 🏗️ Arquitetura

```
Flapy-Bird/
├── main.py              # 🎯 Ponto de entrada e loop principal
├── config.py            # ⚙️ Configurações centralizadas
├── hand_tracking.py     # 📷 Detecção de mão via MediaPipe
├── gesture_mapping.py   # 🤚 Interpretação de gestos
├── game_logic.py        # 🎮 Motor do jogo (física, colisões)
├── requirements.txt     # 📦 Dependências Python
├── README.md            # 📖 Documentação
├── demo_script.md       # 🎬 Script de demonstração
└── assets/              # 🖼️ Recursos (imagens, sons)
```

### Diagrama de Classes

```
┌──────────────────┐
│  FlappyBirdApp   │ ◄── Loop principal
└────────┬─────────┘
         │ usa
         ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  HandTracker   │───▶│ GestureMapper  │───▶│ FlappyBirdGame │
└────────────────┘    └────────────────┘    └────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   HandData     │    │ GestureCommand │    │  Bird, Pipe    │
│ (landmarks,    │    │ (should_jump,  │    │  (entidades)   │
│  position)     │    │  target_y)     │    │                │
└────────────────┘    └────────────────┘    └────────────────┘
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Python 3.8+** | Linguagem principal |
| **OpenCV** | Captura e processamento de vídeo |
| **MediaPipe** | Detecção de mão (21 landmarks) |
| **Pygame** | Motor gráfico e loop do jogo |
| **NumPy** | Operações numéricas e filtros |

### Por que essas tecnologias?

- **MediaPipe**: Modelo pré-treinado de alta performance, roda em CPU
- **OpenCV**: Padrão da indústria para visão computacional
- **Pygame**: Simples, eficiente, perfeito para jogos 2D
- **NumPy**: Essencial para cálculos de filtro temporal

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Veja como participar:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/NovaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: nova feature'`)
4. **Push** para a branch (`git push origin feature/NovaFeature`)
5. Abra um **Pull Request**

### Diretrizes
- Siga o estilo de código existente
- Adicione docstrings para novas funções
- Teste suas alterações antes de submeter
- Atualize a documentação se necessário

---

## 🗺️ Roadmap

### Versão 1.0 (Atual)
- [x] Controle por gestos (discreto e contínuo)
- [x] Gameplay básico do Flappy Bird
- [x] Sistema de pontuação
- [x] Modo debug

### Versão 1.1 (Planejado)
- [ ] Efeitos sonoros
- [ ] Sprites animados do pássaro
- [ ] Temas visuais (dia/noite)
- [ ] Medalhas por pontuação

### Versão 2.0 (Futuro)
- [ ] Modo multiplayer local (2 mãos = 2 pássaros)
- [ ] Reconhecimento de gestos customizados
- [ ] Leaderboard online
- [ ] Suporte a diferentes resoluções
- [ ] Versão mobile (via câmera do celular)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Matheus Siqueira**
- GitHub: [@matheussiqueira-dev](https://github.com/matheussiqueira-dev)

---

<p align="center">
  Feito com ❤️ e ☕ | 2024
</p>

<p align="center">
  <a href="#-flappy-bird---controle-por-gestos">⬆️ Voltar ao topo</a>
</p>
