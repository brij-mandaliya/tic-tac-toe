<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import WinnerComponent from './WinnerComponent.vue'

const props = defineProps({
  gameStarted: Boolean,
  playerSymbol: String,
  xPlayerName: String,
  oPlayerName: String,
  board: Array,
  currentPlayer: String,
  winner: String,
  winningBlocks: Array,
  currentBlock: Number,
})

const emit = defineEmits(['make-move'])

const willActiveBox = ref(-1)
const willClickBlock = ref(-1)

function hoverBox(jIndex, iIndex) {
  if (props.currentPlayer === props.playerSymbol) {
    if (props.board[iIndex][jIndex] === '') {
      willActiveBox.value = jIndex
      willClickBlock.value = iIndex
    }
    else {
      resetHover()
    }
  }
}

function resetHover() {
  willActiveBox.value = -1
  willClickBlock.value = -1
}

function makeMove(iIndex, jIndex) {
  // Validate move
  if (props.currentPlayer !== props.playerSymbol) {
    console.log('Attempted move, but it is not player\'s turn. Current player:', props.currentPlayer, 'My symbol:', props.playerSymbol)
    return
  }

  if (props.board[iIndex][jIndex] === '') {
    console.log('Child emitting make_move - Block:', iIndex, 'Position:', jIndex)
    emit('make-move', iIndex, jIndex)
  }
  else {
    console.log('Attempted move to occupied position:', iIndex, jIndex)
  }
}

// No socket listeners in child component anymore
// All socket communication is handled by parent

const xWins = computed(() => {
  return props.winningBlocks.filter(item => item === 'X').length
})

const oWins = computed(() => {
  return props.winningBlocks.filter(item => item === 'O').length
})

const xDisplayName = computed(() => {
  return props.xPlayerName?.trim() || '{X_Player}'
})

const oDisplayName = computed(() => {
  return props.oPlayerName?.trim() || '{O_Player}'
})

const currentPlayerName = computed(() => {
  if (props.currentPlayer === 'X') {
    return xDisplayName.value
  }
  if (props.currentPlayer === 'O') {
    return oDisplayName.value
  }
  return props.currentPlayer
})
</script>

<template>
  <!-- Winner Display -->
  <div v-if="props.winner !== ''" class="row justify-content-center">
    <div class="winner-container position-relative">
      <WinnerComponent />

      <div class="overlay-text celebration-glow fade-text">
        {{ props.winner }}
      </div>
    </div>
  </div>

  <!-- Game Layout: Left Panel | Board | Right Panel -->
  <div v-else class="game-layout">
    <!-- LEFT PANEL: Turn + Scores -->
    <div class="side-panel left-panel text-light">
      <div class="panel-card">
        <h6 class="panel-heading">Current Turn</h6>
        <div class="turn-display">
          <span v-if="props.currentPlayer === props.playerSymbol" class="turn-name">{{ currentPlayerName }}</span>
          <span v-else class="turn-waiting">Waiting...</span>
        </div>
      </div>

      <div class="panel-card">
        <h6 class="panel-heading">Scoreboard</h6>
        <div class="score-row" :class="{ 'celebration-glow': props.currentPlayer === 'X' }">
          <span class="score-name">{{ xDisplayName }}</span>
          <span class="score-value">{{ xWins }}</span>
        </div>
        <div class="score-row" :class="{ 'celebration-glow': props.currentPlayer === 'O' }">
          <span class="score-name">{{ oDisplayName }}</span>
          <span class="score-value">{{ oWins }}</span>
        </div>
      </div>
    </div>

    <!-- CENTER: Game Board -->
    <div class="board-container">
      <div class="board-grid text-light">
        <div
          v-for="(i, iIndex) in props.board"
          :key="iIndex"
          class="board-cell"
          :class="`box-${iIndex}`"
        >
          <div v-if="props.winningBlocks[iIndex] !== ''" class="win-label">
            Win {{ props.winningBlocks[iIndex] }}
          </div>
          <div
            class="block"
            :class="{
              'active-block': props.currentBlock === iIndex,
              'disabled-block':
                (props.currentBlock !== iIndex && props.currentBlock >= 0)
                || props.winningBlocks[iIndex] !== ''
                || props.currentPlayer !== props.playerSymbol,
              'will-be-active': willActiveBox === iIndex && props.winningBlocks[iIndex] === '',
            }"
          >
            <div
              v-for="(j, jIndex) in i"
              :key="jIndex"
              class="cell"
              @click="makeMove(iIndex, jIndex)"
              @mouseover="hoverBox(jIndex, iIndex)"
              @mouseleave="resetHover()"
            >
              <div v-if="willActiveBox === jIndex && willClickBlock === iIndex && j === ''" class="opacity-50">
                {{ props.currentPlayer }}
              </div>
              {{ j }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: Player Info -->
    <div class="side-panel right-panel text-light">
      <div class="panel-card">
        <h6 class="panel-heading">Players</h6>
        <div class="player-row">
          <span class="player-symbol symbol-x">X</span>
          <span class="player-name">{{ xDisplayName }}</span>
        </div>
        <div class="player-row">
          <span class="player-symbol symbol-o">O</span>
          <span class="player-name">{{ oDisplayName }}</span>
        </div>
      </div>

      <div class="panel-card">
        <h6 class="panel-heading">Your Symbol</h6>
        <div class="my-symbol">
          {{ props.playerSymbol || '?' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 3-Column Game Layout ===== */
.game-layout {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  gap: 1.5rem;
  align-items: start;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

/* ===== Winner Container ===== */
.winner-container {
  width: min(600px, 90vw);
  height: min(700px, 80vh);
}

/* ===== Side Panels ===== */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.panel-card {
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 12px;
  padding: 1rem;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.panel-heading {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(220, 38, 38, 0.8);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(220, 38, 38, 0.15);
  font-weight: 700;
}

/* ===== Turn Display ===== */
.turn-display {
  text-align: center;
  padding: 0.5rem 0;
}

.turn-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #dc2626;
}

.turn-waiting {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

/* ===== Score Rows ===== */
.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.score-row + .score-row {
  margin-top: 0.35rem;
}

.score-name {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.score-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  min-width: 1.5rem;
  text-align: center;
}

/* ===== Player Rows (Right Panel) ===== */
.player-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.4rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.player-row + .player-row {
  margin-top: 0.35rem;
}

.player-symbol {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  border-radius: 6px;
  flex-shrink: 0;
}

.symbol-x {
  background: rgba(220, 38, 38, 0.2);
  color: #ef4444;
  border: 1px solid rgba(220, 38, 38, 0.4);
}

.symbol-o {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.player-name {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-symbol {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: #dc2626;
  text-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
  padding: 0.5rem 0;
}

/* ===== Board Container ===== */
.board-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* ===== Board Grid (3x3 outer) ===== */
.board-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  text-align: center;
  width: 100%;
  max-width: 750px;
}

.board-cell {
  border: 1px solid rgba(220, 38, 38, 0.5);
  padding: clamp(0.3rem, 0.8vw, 0.85rem);
  position: relative;
}

/* ===== Block (inner 3x3) ===== */
.block {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: clamp(2px, 0.4vw, 4px);
  transition: transform 0.3s ease;
}

/* ===== Cell ===== */
.cell {
  height: clamp(1.5rem, 3.5vw, 3rem);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 3vw, 2.5rem);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cell:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.04);
}

/* ===== Win Label ===== */
.win-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  font-size: clamp(0.9rem, 2vw, 1.5rem);
  text-align: center;
  color: #4ade80;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  pointer-events: none;
}

/* ===== Block States ===== */
.active-block {
  border: 2px solid #4ade80;
  box-shadow: 0 0 12px #4ade80;
  transform: scale(1.04);
}

.disabled-block {
  pointer-events: none;
  opacity: 0.3;
}

.will-be-active {
  background-color: rgba(0, 255, 42, 0.1);
  opacity: 1;
}

/* ===== Celebration Glow ===== */
.celebration-glow {
  animation: glow 0.5s ease-in-out infinite alternate;
  font-weight: bold;
}

@keyframes glow {
  from {
    text-shadow:
      0 0 5px #fff,
      0 0 10px #f39c12,
      0 0 15px #f39c12;
  }
  to {
    text-shadow:
      0 0 10px #fff,
      0 0 20px #f39c12,
      0 0 30px #f39c12;
  }
}

/* ===== Winner Overlay ===== */
.overlay-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: bold;
  color: white;
  z-index: 10;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.fade-text {
  animation: text-grow 1s ease-in-out infinite alternate-reverse;
}

@keyframes text-grow {
  from {
    font-size: clamp(1.8rem, 5vw, 40px);
    text-shadow:
      0 0 5px #fff,
      0 0 10px #f39c12,
      0 0 15px #f39c12;
  }
  to {
    font-size: clamp(2.5rem, 7vw, 60px);
    text-shadow:
      0 0 10px #fff,
      0 0 20px #f39c12,
      0 0 30px #f39c12;
  }
}

/* ========================================
   RESPONSIVE BREAKPOINTS
   ======================================== */

/* Large screens: 3-column layout (>= 992px) — default above */

/* Medium screens (tablets, 768px-991px): board on top, panels side-by-side below */
@media (max-width: 991px) {
  .game-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 1rem;
    max-width: 650px;
  }

  .side-panel {
    position: static;
  }

  .left-panel {
    order: 1;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .left-panel .panel-card {
    flex: 1;
    min-width: 140px;
  }

  .board-container {
    order: 2;
  }

  .right-panel {
    order: 3;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .right-panel .panel-card {
    flex: 1;
    min-width: 140px;
  }

  .board-grid {
    max-width: 600px;
  }

  .cell {
    height: clamp(1.5rem, 4vw, 2.2rem);
    font-size: clamp(1rem, 3vw, 1.75rem);
  }
}

/* Small screens (577px-767px) */
@media (max-width: 767px) {
  .game-layout {
    padding: 0.75rem;
    max-width: 100%;
  }

  .board-grid {
    max-width: 500px;
  }

  .cell {
    height: clamp(1.5rem, 4vw, 2rem);
    font-size: clamp(0.9rem, 2.8vw, 1.5rem);
  }

  .my-symbol {
    font-size: 2rem;
  }
}

/* Extra small screens (phones, <= 480px) */
@media (max-width: 480px) {
  .game-layout {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .left-panel,
  .right-panel {
    flex-direction: column;
  }

  .panel-card {
    padding: 0.65rem;
  }

  .panel-heading {
    font-size: 0.6rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.35rem;
  }

  .turn-name {
    font-size: 0.95rem;
  }

  .score-name {
    font-size: 0.75rem;
    max-width: 90px;
  }

  .score-value {
    font-size: 1rem;
  }

  .player-symbol {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.8rem;
  }

  .player-name {
    font-size: 0.75rem;
  }

  .my-symbol {
    font-size: 1.75rem;
  }

  .board-cell {
    padding: 0.15rem;
  }

  .cell {
    height: 1.4rem;
    font-size: 0.8rem;
  }

  .block {
    gap: 1px;
  }
}

/* Very small screens (< 360px) */
@media (max-width: 360px) {
  .cell {
    height: 1.2rem;
    font-size: 0.7rem;
  }

  .board-cell {
    padding: 0.1rem;
  }

  .panel-card {
    padding: 0.5rem;
  }
}
</style>
