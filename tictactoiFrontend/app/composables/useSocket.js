import { io } from 'socket.io-client'

export function useSocket() {
  const socket = io('http://localhost:4000', {
    transports: ['websocket'],
  })

  const createGame = () => {
    socket.emit('create_game')
  }

  const joinGame = (gameId) => {
    socket.emit('join_game', { roomId: gameId }) // gameId → roomId
  }

  const makeMove = (roomId, iIndex, jIndex) => {
    socket.emit('make_move', {
      roomId,
      blockIndex: iIndex,
      cellIndex: jIndex,
    })
  }

  return {
    socket,
    createGame,
    joinGame,
    makeMove,
  }
}
