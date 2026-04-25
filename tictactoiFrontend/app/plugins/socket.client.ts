import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const socketUrl = `${window.location.protocol}//${window.location.hostname}:4000`
  const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: false,
    multiplex: true
  })

  // Add global error handler
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts')
  })

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts')
  })

  return {
    provide: {
      socket,
    },
  }
})