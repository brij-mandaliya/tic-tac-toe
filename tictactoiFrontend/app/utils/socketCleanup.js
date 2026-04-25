export function cleanupSocketListeners(socket, events) {
  events.forEach(event => {
    socket.off(event)
  })
}

export function setupSocketListeners(socket, handlers) {
  // Clean up first
  Object.keys(handlers).forEach(event => {
    socket.off(event)
  })
  
  // Set up new handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })
}