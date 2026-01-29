# 🎬 Script de Demonstração ao Vivo

Este documento contém instruções detalhadas para demonstrar o **Flappy Bird com Controle por Gestos** em apresentações ao vivo.

---

## 📋 Checklist Pré-Demonstração

### Hardware
- [ ] Webcam funcionando e posicionada corretamente
- [ ] Iluminação adequada (evitar contraluz)
- [ ] Monitor/projetor configurado
- [ ] Computador com bateria suficiente ou conectado

### Software
- [ ] Ambiente virtual ativado
- [ ] Dependências instaladas (`pip install -r requirements.txt`)
- [ ] Teste rápido do jogo antes da apresentação
- [ ] Verificar se a câmera não está sendo usada por outro programa

### Ambiente
- [ ] Fundo neutro atrás do apresentador (menos distrações para o modelo)
- [ ] Distância da câmera: 50-100cm
- [ ] Espaço para movimentar o braço livremente

---

## 🎭 Roteiro da Demonstração

### 1. Introdução (2 minutos)

**O que dizer:**
> "Hoje vou demonstrar como é possível jogar um jogo clássico sem tocar em nenhum dispositivo de entrada. Usando apenas uma webcam e técnicas de visão computacional, vamos controlar o Flappy Bird com gestos da mão."

**Pontos a destacar:**
- Interação natural sem dispositivos físicos
- Uso de Machine Learning em tempo real
- Aplicação prática de visão computacional

### 2. Visão Geral da Tecnologia (3 minutos)

**Mostrar na tela:**
```
1. Abrir o arquivo config.py
2. Mostrar as configurações principais
3. Explicar brevemente a arquitetura
```

**O que dizer:**
> "O projeto usa MediaPipe Hands do Google, que detecta 21 pontos da mão em tempo real. Esses pontos são processados para entender se a mão está aberta ou fechada, e sua posição vertical."

**Diagrama para explicar:**
```
Webcam → MediaPipe → Interpretação → Jogo
         (21 pontos)  (gesto/altura)  (pulo/posição)
```

### 3. Demonstração do Modo Discreto (3 minutos)

**Comandos:**
```bash
python main.py
```

**O que fazer:**
1. Iniciar o jogo
2. Mostrar que ao **abrir a mão**, o pássaro pula
3. Mostrar que ao **fechar a mão**, ele cai
4. Jogar algumas rodadas demonstrando o controle

**O que dizer:**
> "No modo discreto, abrir a mão é como pressionar a barra de espaço - o pássaro recebe um impulso para cima. Quando fecho a mão, a gravidade faz seu trabalho naturalmente."

**Dica:** Faça gestos exagerados e claros para a plateia ver

### 4. Demonstração do Modo Contínuo (3 minutos)

**Trocar modo:**
- Pressionar tecla **M** para alternar

**O que fazer:**
1. Mostrar que a altura da mão controla diretamente a altura do pássaro
2. Demonstrar movimentos suaves
3. Mostrar como é mais intuitivo, mas requer mais coordenação

**O que dizer:**
> "Agora no modo contínuo, minha mão funciona como um controle analógico. Mão alta, pássaro alto. Mão baixa, pássaro baixo. O jogo interpola suavemente entre as posições."

### 5. Features de Debug (2 minutos)

**Comandos durante o jogo:**
- **D** - Toggle debug
- **C** - Toggle câmera

**O que mostrar:**
- Painel de FPS e confiança
- Preview da câmera com landmarks
- Indicador visual do estado da mão

**O que dizer:**
> "Para desenvolvimento, temos um modo debug completo. Vemos o FPS da câmera, a confiança da detecção, e um preview em tempo real dos pontos da mão que o modelo está detectando."

### 6. Por Dentro do Código (5 minutos - opcional)

**Arquivos para mostrar:**
1. `hand_tracking.py` - Detecção da mão
2. `gesture_mapping.py` - Interpretação dos gestos
3. `game_logic.py` - Motor do jogo

**Pontos de código interessantes:**

```python
# Filtro temporal para suavização
def update(self, x: float, y: float) -> Tuple[float, float]:
    self.x_buffer.append(x)
    self.y_buffer.append(y)
    return np.mean(self.x_buffer), np.mean(self.y_buffer)
```

```python
# Detecção de mão aberta
is_open = tip.y < pip.y - threshold  # Ponta acima da articulação
```

### 7. Q&A e Experimentação (tempo restante)

**Sugestões:**
- Deixar a plateia tentar jogar
- Responder perguntas técnicas
- Discutir melhorias possíveis

---

## 🚨 Troubleshooting ao Vivo

### Problema: Mão não detectada

**Soluções rápidas:**
1. Verificar iluminação
2. Afastar-se um pouco da câmera
3. Usar a outra mão
4. Verificar se a câmera não está coberta

**O que dizer:**
> "A detecção pode variar com a iluminação. Vou ajustar minha posição..."

### Problema: Jogo travado ou lento

**Soluções:**
1. Fechar outros programas
2. Diminuir resolução da câmera em `config.py`
3. Desativar preview da câmera (tecla C)

### Problema: Webcam não abre

**Soluções:**
1. Fechar outros apps usando a câmera
2. Verificar permissões
3. Trocar `camera_index` em `config.py` (0, 1, 2...)

---

## 📊 Estatísticas para Mencionar

- **MediaPipe Hands**: Detecta 21 landmarks em ~10ms por frame
- **FPS típico**: 30-60 fps em hardware modesto
- **Latência**: <50ms entre gesto e ação
- **Precisão**: ~95% de detecção correta com boa iluminação

---

## 🎁 Extras para Impressionar

### 1. Comparar com o modo tradicional

```bash
# No arquivo game_logic.py, descomente o teste standalone
python game_logic.py
```
- Mostre jogando com teclado primeiro
- Depois troque para gestos
- Destaque a diferença de experiência

### 2. Mostrar o filtro temporal em ação

- Desabilite o filtro temporariamente
- Mostre o tremor (jitter)
- Reabilite e mostre a suavização

### 3. Modo de dois gestos

Se tiver tempo, implemente ao vivo:
- Polegar para cima = power-up
- Dois dedos em V = super velocidade

---

## 📝 Frases de Efeito

Para encerrar:

> "Com algumas centenas de linhas de Python e uma webcam comum, transformamos a mão em um controle de jogo. Isso é o poder da visão computacional moderna - acessível, prática e divertida."

> "O futuro da interface humano-computador não está apenas em teclados e mouses, mas em interações naturais que já fazemos no dia a dia."

> "Este projeto mostra que tecnologias complexas como machine learning podem ser aplicadas de formas criativas e acessíveis."

---

## ⏱️ Cronograma Sugerido

| Fase | Tempo | Total |
|------|-------|-------|
| Introdução | 2 min | 2 min |
| Tecnologia | 3 min | 5 min |
| Demo Modo 1 | 3 min | 8 min |
| Demo Modo 2 | 3 min | 11 min |
| Debug | 2 min | 13 min |
| Código | 5 min | 18 min |
| Q&A | 7 min | 25 min |

**Total sugerido: 25 minutos**

---

<p align="center">
  <strong>Boa apresentação! 🎤</strong>
</p>
