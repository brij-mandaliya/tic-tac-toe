<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const { $socket } = useNuxtApp()
const route = useRoute()
const anotherPlayerJoin = ref(false)
const showShareModal = ref(true)
const roomId = ref('')
const showCopyNotification = ref(false)
const playerSymbol = ref('')
const xPlayerName = ref('')
const oPlayerName = ref('')

// Add these new state variables for game
const gameBoard = ref(Array.from({ length: 9 }, () => Array.from({ length: 9 }).fill('')))
const currentPlayer = ref('X')
const gameWinner = ref('')
const winningBlocks = ref(['', '', '', '', '', '', '', '', ''])
const currentValidBlock = ref(-1)

let gameUpdateHandler = null
let errorHandler = null
let symbolAssignedHandler = null
let playerJoinedHandler = null
let connectHandler = null
const isInitialConnection = ref(true)

// Emit move to server
function makeMove(blockIndex, positionIndex) {
  const gameId = route.query.gameId
  console.log('Parent emitting make_move:', { block: blockIndex, position: positionIndex })
  $socket.emit('make_move', { gameId, block: blockIndex, position: positionIndex })
}

// Handle game update from server
gameUpdateHandler = (gameData) => {
  console.log('Parent received game_update:', gameData)
  
  if (gameData.winner) {
    console.log('Game winner detected:', gameData.winner)
    gameWinner.value = gameData.winner
  }
  
  if (gameData.board) {
    gameBoard.value = gameData.board
  }
  
  if (gameData.turn) {
    currentPlayer.value = gameData.turn
  }
  
  if (gameData.winningBlocks) {
    winningBlocks.value = gameData.winningBlocks
  }

  if (gameData.playerNames) {
    xPlayerName.value = gameData.playerNames.X || xPlayerName.value
    oPlayerName.value = gameData.playerNames.O || oPlayerName.value
  }
  
  if (gameData.currentBlock !== undefined && gameData.currentBlock !== null) {
    console.log('Next valid block:', gameData.currentBlock)
    currentValidBlock.value = gameData.currentBlock
  }
  else {
    console.log('Any block is valid for next move')
    currentValidBlock.value = -1
  }
  
  // Check if another player joined
  if (gameData.players && gameData.players.length > 1) {
    anotherPlayerJoin.value = true
    closeModal()
  }
}

function exitGame() {
  const gameId = route.query.gameId
  console.log('Exiting game:', gameId)
  $socket.emit('leave_game', { gameId })

  setTimeout(() => {
    navigateTo('/')
  }, 500)
}

function closeModal() {
  console.log('Closing share modal')
  showShareModal.value = false
}

function copyRoomId() {
  console.log('Copying room ID:', roomId.value)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(roomId.value).then(() => {
        console.log('Room ID copied successfully')
        showNotification()
      }).catch((err) => {
        console.error('Failed to copy room ID:', err)
        fallbackCopyTextToClipboard(roomId.value)
      })
    }
    else {
      fallbackCopyTextToClipboard(roomId.value)
    }
  }
  catch (err) {
    console.error('Error in copyRoomId:', err)
    fallbackCopyTextToClipboard(roomId.value)
  }
}

function showNotification() {
  showCopyNotification.value = true
  setTimeout(() => {
    showCopyNotification.value = false
  }, 3000)
}

errorHandler = (message) => {
  console.error('Received socket error:', message)
  if (message === 'invalid Player') {
    useToastify('PlayerId is not valid', {
      autoClose: 3000,
      type: 'error',
    })
    setTimeout(() => {
      navigateTo('/')
    }, 5000)
  }
}

symbolAssignedHandler = (symbol) => {
  console.log('Received symbol_assigned:', symbol)
  playerSymbol.value = symbol
  if (symbol === 'X') {
    xPlayerName.value = String(route.query.name || '')
  }
  else if (symbol === 'O') {
    oPlayerName.value = String(route.query.name || '')
  }
  anotherPlayerJoin.value = true
  closeModal()
}

playerJoinedHandler = (data) => {
  console.log('Received player_joined:', data)
  if (data?.symbol === 'X') {
    xPlayerName.value = data.playerName || xPlayerName.value
  }
  else if (data?.symbol === 'O') {
    oPlayerName.value = data.playerName || oPlayerName.value
  }
  anotherPlayerJoin.value = true
  closeModal()
}

connectHandler = () => {
  if (isInitialConnection.value) {
    isInitialConnection.value = false
    return
  }
  
  console.log('Socket reconnected, re-identifying player')
  const playerId = localStorage.getItem('playerId')
  const gameId = route.query.gameId
  
  if (playerId && gameId) {
    $socket.emit('identify', { playerId })
    $socket.emit('get_game_state', { gameId })
  }
}

onMounted(() => {
  const playerId = localStorage.getItem('playerId')
  const gameId = route.query.gameId
  const querySymbol = route.query.symbol
  console.log('Game page mounted. PlayerId:', playerId, 'GameId:', gameId, 'Symbol:', querySymbol)
  roomId.value = gameId

  if (querySymbol) {
    playerSymbol.value = querySymbol
  }
  const queryName = String(route.query.name || '')
  if (querySymbol === 'X') {
    xPlayerName.value = queryName
  }
  else if (querySymbol === 'O') {
    oPlayerName.value = queryName
  }

  // Set up socket listeners
  $socket.on('game_update', gameUpdateHandler)
  $socket.on('error', errorHandler)
  $socket.on('symbol_assigned', symbolAssignedHandler)
  $socket.on('player_joined', playerJoinedHandler)
  $socket.on('connect', connectHandler)

  // Mark initial connection as handled since we're doing it manually here
  isInitialConnection.value = false

  console.log('Identifying with playerId:', playerId)
  $socket.emit('identify', { playerId })
  
  // Request initial game state
  $socket.emit('get_game_state', { gameId })
})

onBeforeUnmount(() => {
  // Clean up socket listeners
  $socket.off('game_update', gameUpdateHandler)
  $socket.off('error', errorHandler)
  $socket.off('symbol_assigned', symbolAssignedHandler)
  $socket.off('player_joined', playerJoinedHandler)
  $socket.off('connect', connectHandler)
})

watch(showShareModal, (newValue, oldValue) => {
  console.log('showShareModal changed:')
  console.log('From:', oldValue)
  console.log('To:', newValue)
})

function fallbackCopyTextToClipboard(text) {
  console.log('Using fallback copy method for:', text)
  const textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      console.log('Fallback copy successful')
      showNotification()
    }
    else {
      console.error('Fallback copy failed')
      useToastify(`Failed to copy Room ID. Please copy manually: ${text}`, {
        autoClose: 3000,
        type: 'error',
      })
    }
  }
  catch (err) {
    console.error('Error in fallback copy:', err)
    useToastify(`Copy failed. Room ID: ${text} (Please copy manually)`, {
      autoClose: 3000,
      type: 'error',
    })
  }

  document.body.removeChild(textArea)
}
</script>

<template>
  <div class="container-fluid min-vh-100 bg-dark">
    <!-- Copy Notification Toast -->
    <div v-if="showCopyNotification" class="copy-notification">
      <div class="notification-content">
        <i class="bi bi-check-circle-fill text-success me-2" />
        <span>Room ID is copied to clipboard!</span>
      </div>
    </div>

    <!-- Modal Dialog (like window.alert but custom) -->
    <div v-if="showShareModal" class="modal-overlay" @click="closeModal">
      <div class="modal-dialog" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <h4 class="modal-title">
            <i class="bi bi-exclamation-circle text-warning me-2" />
            Waiting for Player!
          </h4>
          <button type="button" class="btn-close" @click="closeModal">
            <i class="bi bi-x" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <p class="mb-3">
            Please share this room ID with your friend to start the game:
          </p>

          <div class="room-id-container">
            <div class="room-id-display">
              <strong>{{ roomId }}</strong>
            </div>
          </div>

          <p class="text-muted mt-3 mb-0">
            <small>The game will start automatically when your friend joins!</small>
          </p>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="exitGame">
            <i class="bi bi-box-arrow-right me-1" />
            Exit Game
          </button>
          <button type="button" class="btn btn-primary" @click="copyRoomId">
            <i class="bi bi-clipboard me-1" />
            Copy Room ID
          </button>
        </div>
      </div>
    </div>
    <div class="row justify-content-center">
      <h2 class="text-light text-center mt-3 col-10">
        Ultimate Tic-Tac-Toe
      </h2>
      <i class="btn btn-outline-danger bi bi-box-arrow-right col-2 mt-2 pt-2" style="width:5%;height:5%;" @click="exitGame" />
    </div>
    <div class="row justify-content-center">
      <MainBlock 
        :game-started="anotherPlayerJoin" 
        :player-symbol="playerSymbol"
        :x-player-name="xPlayerName"
        :o-player-name="oPlayerName"
        :board="gameBoard"
        :current-player="currentPlayer"
        :winner="gameWinner"
        :winning-blocks="winningBlocks"
        :current-block="currentValidBlock"
        @make-move="makeMove"
        class="col"
      />
    </div>
  </div>
</template>

<style scoped>
.disabled-block {
  pointer-events: none; /* Disables click */
  opacity: 0.3; /* Optional: to visually indicate it's disabled */
}

/* Modal Dialog Styles (Red & Black Glassmorphism Theme) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 20, 0.8));
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.modal-dialog {
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10000;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(220, 38, 38, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(0, 0, 0, 0.2));
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.modal-title i {
  color: #dc2626 !important;
  filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.6));
}

.btn-close {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  font-size: 1.2rem;
  cursor: pointer;
  color: #dc2626;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-close:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
}

.modal-body {
  padding: 1.5rem;
  color: #e5e5e5;
  background: rgba(0, 0, 0, 0.3);
}

.room-id-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border: 2px solid rgba(220, 38, 38, 0.4);
  border-radius: 12px;
  margin: 1.5rem 0;
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.room-id-display {
  flex: 1;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 1.4rem;
  color: #ffffff;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.btn-copy {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
  border: 1px solid rgba(220, 38, 38, 0.5);
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.btn-copy:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.5);
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid rgba(220, 38, 38, 0.2);
  display: flex;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(220, 38, 38, 0.05));
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.btn-secondary {
  background: rgba(75, 85, 99, 0.2);
  color: #d1d5db;
  border-color: rgba(75, 85, 99, 0.4);
}

.btn-secondary:hover {
  background: rgba(75, 85, 99, 0.4);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(75, 85, 99, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
  border-color: rgba(220, 38, 38, 0.5);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.5);
}

/* Additional glassmorphism text styling */
.modal-body p {
  color: #d1d5db;
}

.modal-body .text-muted {
  color: #9ca3af !important;
}

/* Copy Notification Toast */
.copy-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-content {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(21, 128, 61, 0.9));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  min-width: 250px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.notification-content i {
  color: #ffffff !important;
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.8));
  font-size: 1.1rem;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Auto fade out animation */
.copy-notification {
  animation:
    slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    fadeOut 0.5s ease-in 2.5s forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
}
</style>
