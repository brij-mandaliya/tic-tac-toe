<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const { $socket } = useNuxtApp()

const creatingGame = ref(false)
const joiningGame = ref(false)

const player1 = ref('')
const player2 = ref('')
const gameID = ref(null)
const playerId = ref('')

const retry = ref(0)
let errorHandler = null
let gameCreatedHandler = null
let symbolAssignedHandler = null

function createGame() {
  const playerName = player1.value.trim()
  if (playerName === '') {
    useToastify('Please enter a name for create game', {
      autoClose: 3000,
      type: 'error',
    })
    return
  }

  if (gameCreatedHandler) {
    $socket.off('game_created', gameCreatedHandler)
  }

  gameCreatedHandler = ({ gameId, symbol }) => {
    navigateTo(`/game?gameId=${gameId}&name=${playerName}&symbol=${symbol}`)
    gameCreatedHandler = null
  }

  $socket.once('game_created', gameCreatedHandler)

  playerId.value = getOrCreatePlayerId()
  $socket.emit('create_game', { name: playerName, playerId: playerId.value })
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem('playerId')
  if (!id) {
    id = uuidv4()
    localStorage.setItem('playerId', id)
  }
  return id
}

function joinGame() {
  const requestedGameId = String(gameID.value ?? '').trim()
  if (requestedGameId === '') {
    useToastify('Please enter a GameID for Join game', {
      autoClose: 3000,
      type: 'error',
    })
    return
  }

  const playerName = player2.value.trim()
  if (playerName === '') {
    useToastify('Please enter a name for Join game', {
      autoClose: 3000,
      type: 'error',
    })
    return
  }

  if (symbolAssignedHandler) {
    $socket.off('symbol_assigned', symbolAssignedHandler)
  }

  symbolAssignedHandler = (symbol) => {
    navigateTo(`/game?gameId=${requestedGameId}&name=${playerName}&symbol=${symbol}`)
    symbolAssignedHandler = null
  }
  $socket.once('symbol_assigned', symbolAssignedHandler)

  playerId.value = getOrCreatePlayerId()
  if (!playerId.value) {
    localStorage.removeItem('playerId')
    playerId.value = getOrCreatePlayerId()
  }
  $socket.emit('join_game', { gameId: requestedGameId, playerName: playerName, playerId: playerId.value })
}

function setupErrorHandler() {
  errorHandler = (message) => {
    if (message.includes('Player ID is undefined')) {
      if (retry.value > 3) {
        useToastify('Error in connecting to server', {
          autoClose: 3000,
          type: 'error',
        })
      }
      else {
        retry.value++
        joinGame()
      }
    }
    else if (typeof message === 'string' && message.trim() !== '') {
      useToastify(message, {
        autoClose: 3000,
        type: 'error',
      })
    }
  }
  $socket.on('error', errorHandler)
}

onMounted(() => {
  setupErrorHandler()
})

onBeforeUnmount(() => {
  if (errorHandler) {
    $socket.off('error', errorHandler)
  }
  if (gameCreatedHandler) {
    $socket.off('game_created', gameCreatedHandler)
  }
  if (symbolAssignedHandler) {
    $socket.off('symbol_assigned', symbolAssignedHandler)
  }
})

function toggleCreateGame() {
  creatingGame.value = true
  joiningGame.value = false
}

function toggleJoinGame() {
  joiningGame.value = true
  creatingGame.value = false
}

function toggleOffJoinGame() {
  joiningGame.value = false
}

function toggleOffCreateGame() {
  creatingGame.value = false
}
</script>

<template>
  <div class="container-fluid bg-dark text-light d-flex flex-column min-vh-100">
    <!-- Title Section -->
    <div class="row justify-content-center pt-5 celebration-glow text-center">
      <div class="col-12">
        <h1 class="mb-4">
          Select Game Option
        </h1>
      </div>
    </div>

    <!-- Game Options Section -->
    <div class="row flex-grow-1 justify-content-center align-items-center">
      <!-- Create Game -->
      <div class="col-12 col-md-6 d-flex flex-column align-items-center mb-5 mb-md-0 text-center">
        <div class="symbol text-danger display-1">
          X
        </div>
        <transition name="fade">
          <input
            v-if="creatingGame"
            v-model="player1"
            type="text"
            class="form-control liquid-input mt-3"
            placeholder="Enter Your Name"
          >
        </transition>

        <div class="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mt-4 w-100 w-sm-75 w-md-50">
          <button v-if="creatingGame" class="btn btn-outline-danger game-btn" @click="createGame">
            Submit
          </button>
          <button v-else class="btn btn-outline-danger game-btn" @click="toggleCreateGame">
            Create Game
          </button>
          <transition name="fade">
            <button
              v-if="creatingGame"
              class="btn btn-outline-danger border mt-sm-0 mt-2"
              @click="toggleOffCreateGame"
            >
              X
            </button>
          </transition>
        </div>
      </div>

      <!-- Join Game -->
      <div class="col-12 col-md-6 d-flex flex-column align-items-center text-center">
        <div class="symbol text-danger display-1">
          O
        </div>
        <transition name="fade">
          <input
            v-if="joiningGame"
            v-model="gameID"
            type="text"
            class="form-control liquid-input mt-3"
            placeholder="Enter Game ID"
          >
        </transition>
        <transition name="fade">
          <input
            v-if="joiningGame"
            v-model="player2"
            type="text"
            class="form-control liquid-input mt-3"
            placeholder="Enter Your Name"
          >
        </transition>

        <div class="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mt-4 w-100 w-sm-75 w-md-50">
          <button v-if="joiningGame" class="btn btn-outline-danger game-btn" @click="joinGame">
            Submit
          </button>
          <button v-else class="btn btn-outline-danger game-btn" @click="toggleJoinGame">
            Join Game
          </button>
          <transition name="fade">
            <button
              v-if="joiningGame"
              class="btn btn-outline-danger border mt-sm-0 mt-2"
              @click="toggleOffJoinGame"
            >
              X
            </button>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.symbol {
  font-size: 400px;
}

.game-btn {
  font-size: 1.2rem;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
}

.game-input {
  border: 2px solid red;
  opacity: 0.5;
  background-color: black;
  color: white;
  font-size: 1.1rem;
  padding: 0.5rem;
  width: 80%;
  border-radius: 5px;
}

.liquid-input {
  background: rgba(255, 255, 255, 0.2); /* Semi-transparent white */
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px); /* Frosted glass effect */
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  border-radius: 12px;
  padding: 10px 15px;
  font-size: 1rem;
  color: white;
  outline: none;
  width: 60%;
  transition:
    background 0.3s ease,
    border 0.3s ease;
}

.liquid-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.liquid-input:focus {
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.celebration-glow {
  animation: glow 1.5s ease-in-out infinite alternate;
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
      0 0 20px #f31212,
      0 0 30px #f39c12;
  }
}
</style>
