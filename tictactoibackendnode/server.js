import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
const app = express();



const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const INACTIVITY_LIMIT = 60 * 1000; // 1 minute
const MAX_TIMEOUTS = 2;

const games = {}; // { roomId: { ...gameState } }
const playerSessions = {}; // { playerId: { gameId, socketId, name } }

app.get('/datas', (req, res) => {
    // Create a clean copy without circular references
  const cleanGames = JSON.parse(JSON.stringify(games, getCircularReplacer()));
  const cleanPlayerSessions = JSON.parse(JSON.stringify(playerSessions, getCircularReplacer()));
  
  res.send({ 
    data: cleanGames, 
    playerSessions: cleanPlayerSessions
  });
});

// Circular reference replacer function
function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
}

function generateRoomId() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function checkBlockWinner(block) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (block[a] && block[a] === block[b] && block[a] === block[c]) {
      return block[a];
    }
  }
  return null;
}

function checkWinner(winningBlocks) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (winningBlocks[a] && winningBlocks[a] === winningBlocks[b] && winningBlocks[a] === winningBlocks[c]) {
      return winningBlocks[a];
    }
  }
  return null;
}

function getPlayerSymbol(socketId, game) {
  const playerIndex = game.players.indexOf(socketId);
  if (playerIndex === -1) {
    return null;
  }
  return playerIndex === 0 ? 'X' : 'O';
}

function getOpponentSocket(roomId, socketId) {
  const game = games[roomId];
  return game.players.find((id) => id !== socketId);
}

function getPlayerNameBySocketId(socketId) {
  const session = Object.values(playerSessions).find((entry) => entry.socketId === socketId);
  return session?.playerName || '';
}

function getGamePlayerNames(game) {
  const xSocketId = game.players[0];
  const oSocketId = game.players[1];
  return {
    X: xSocketId ? getPlayerNameBySocketId(xSocketId) : '',
    O: oSocketId ? getPlayerNameBySocketId(oSocketId) : '',
  };
}

function buildGameUpdatePayload(gameId, game, extra = {}) {
  return {
    gameId,
    board: game.board,
    winningBlocks: game.winningBlocks,
    turn: game.turn,
    players: game.players,
    winner: game.winner,
    currentBlock: game.currentBlock,
    playerNames: getGamePlayerNames(game),
    ...extra,
  };
}

function removePlayerSessionBySocket(socketId) {
  for (const [playerId, session] of Object.entries(playerSessions)) {
    if (session.socketId === socketId) {
      delete playerSessions[playerId];
      break;
    }
  }
}

function handlePlayerExit(roomId, socketId, reason) {
  const game = games[roomId];
  if (!game) return;

  const leavingIndex = game.players.indexOf(socketId);
  if (leavingIndex === -1) return;

  const leavingSymbol = leavingIndex === 0 ? 'X' : 'O';
  game.players.splice(leavingIndex, 1);
  removePlayerSessionBySocket(socketId);

  clearTimeout(game.timeoutTimers.X);
  clearTimeout(game.timeoutTimers.O);

  if (game.players.length === 1) {
    const remainingSocketId = game.players[0];
    const winner = leavingSymbol === 'X' ? 'O' : 'X';
    game.winner = winner;

    const remainingPlayerSocket = io.sockets.sockets.get(remainingSocketId);
    if (remainingPlayerSocket) {
      remainingPlayerSocket.emit('game_update', buildGameUpdatePayload(roomId, game, {
        turn: null,
        winner,
        reason,
      }));
    }
  } else if (game.players.length === 0) {
    delete games[roomId];
    console.log(`Game ${roomId} cleaned up`);
  }
}

function startInactivityTimer(roomId, playerSymbol) {
  const game = games[roomId];
  clearTimeout(game.timeoutTimers[playerSymbol]);

  game.timeoutTimers[playerSymbol] = setTimeout(() => {
    game.timeouts[playerSymbol] += 1;

    if (game.timeouts[playerSymbol] >= MAX_TIMEOUTS) {
      const winner = playerSymbol === 'X' ? 'O' : 'X';
      game.winner = winner;

      io.to(roomId).emit('game_update', {
        gameId: roomId,
        board: game.board,
        winningBlocks: game.winningBlocks,
        turn: null,
        winner: winner,
        currentBlock: game.currentBlock,
        playerNames: getGamePlayerNames(game),
        reason: 'timeout',
      });

      // Clean up
      clearTimeout(game.timeoutTimers.X);
      clearTimeout(game.timeoutTimers.O);
    } else {
      io.to(roomId).emit('inactivity_warning', {
        player: playerSymbol,
        strikes: game.timeouts[playerSymbol],
      });
    }
  }, INACTIVITY_LIMIT);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_game', ({ name, playerId }) => {
    const gameId = generateRoomId();
    
    console.log('name:', name);

    games[gameId] = {
      board: Array.from({ length: 9 }, () => Array(9).fill("")),
      winningBlocks: Array(9).fill(""),
      turn: 'X',
      players: [socket.id],
      winner: null,
      timeouts: {
        X: 0,
        O: 0,
      },
      timeoutTimers: {
        X: null,
        O: null,
      },
      currentBlock: null
    };
    playerSessions[playerId] = { gameId, socketId: socket.id, playerName: name, oldSocketId: socket.id }
    socket.join(gameId)

    socket.emit('game_created', { gameId, symbol: 'X' })

    const game = games[gameId]
    io.to(gameId).emit('game_update', buildGameUpdatePayload(gameId, game))
  })

  socket.on('join_game', ({ gameId: rawGameId, playerName, playerId }) => {
    const gameId = String(rawGameId);
    console.log("join_game socket function called", gameId, playerName, playerId)
    if (!playerId) {
      socket.emit('error', 'Player ID is undefined or required');
      return;
    }
    
    const game = games[gameId];
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    if (game.players.length >= 2) {
      socket.emit('error', 'Game is full');
      return;
    }
    playerSessions[playerId] = { gameId, socketId: socket.id, playerName, oldSocketId: socket.id };
    socket.join(gameId);
    
    // Check if player is already in players array (e.g. from previous session)
    if (!game.players.includes(socket.id)) {
      game.players.push(socket.id);
    }

    
    socket.emit('symbol_assigned', 'O')

    io.to(gameId).emit('player_joined', { playerName, symbol: 'O' })

    io.to(gameId).emit('game_update', buildGameUpdatePayload(gameId, game))

    startInactivityTimer(gameId, game.turn);
  })

  socket.on('get_game_state', ({ gameId: rawGameId }) => {
    const gameId = String(rawGameId)
    const game = games[gameId]
    if (game) {
      socket.emit('game_update', buildGameUpdatePayload(gameId, game))
    }
  })

  socket.on('identify', ({ playerId }) => {
    console.log(`identify called for playerId: ${playerId}`)
    if (!playerId) {
      socket.emit('error', 'invalid Player')
      return
    }

    const session = playerSessions[playerId]
    if (!session) {
      console.log(`No session found for playerId: ${playerId}`)
      socket.emit('error', 'invalid Player')
      return
    }

    const { gameId: rawGameId } = session
    const gameId = String(rawGameId)
    const game = games[gameId]
    if (!game) {
      console.log(`No game found for gameId: ${gameId}`)
      socket.emit('error', 'invalid Gamer')
      return
    }

    const oldSocketId = session.socketId
    session.socketId = socket.id
    socket.join(gameId)

    const playerIndex = game.players.indexOf(oldSocketId)
    if (playerIndex !== -1) {
      game.players[playerIndex] = socket.id
    }
    else if (game.players.length < 2 && !game.players.includes(socket.id)) {
      game.players.push(socket.id)
    }
    session.oldSocketId = socket.id

    console.log(`Game found and socket joined: ${gameId}. Current players: ${game.players}`)

    io.to(gameId).emit('game_update', buildGameUpdatePayload(gameId, game))
  })

  socket.on('make_move', ({ gameId: rawGameId, block, position }) => {
    const gameId = String(rawGameId);
    console.log(`backend: make_move : gameId : ${gameId}, block: ${block}, position:${position}`)
    const game = games[gameId];
    if (!game || game.winner) return;

    const playerSymbol = getPlayerSymbol(socket.id, game);
    if (!playerSymbol) {
      socket.emit('error', 'Invalid player for this game');
      return;
    }
    console.log(`comparing the playerSymbol: ${playerSymbol} with game.turn: ${game.turn} and game.board[${block}][${position}] :${game.board[block][position]}`)
    if (game.turn !== playerSymbol) {
      socket.emit('error', 'Invalid move or not your turn');
      return;
    }

    if (game.board[block][position] !== "") {
      socket.emit('error', 'Position already occupied');
      return;
    }

    if (game.winningBlocks[block] !== "") {
      socket.emit('error', 'Block already won');
      return;
    }

    // Apply move
    game.board[block][position] = playerSymbol;

    // Check if this block is won
    const blockWinner = checkBlockWinner(game.board[block]);
    if (blockWinner) {
      game.winningBlocks[block] = blockWinner;
    }

    // Check if overall game is won
    const overallWinner = checkWinner(game.winningBlocks);
    if (overallWinner) {
      game.winner = overallWinner;
    } else {
      // Check if board is full (draw)
      const isBoardFull = game.board.every(block => block.every(cell => cell !== ""));
      if (isBoardFull) {
        game.winner = 'draw';
      } else {
        game.turn = playerSymbol === 'X' ? 'O' : 'X';
      }
    }

    if (game.winningBlocks[position] !== "") {
        game.currentBlock = null;
    } else {
        game.currentBlock = position;
    }

    // Broadcast update
    io.to(gameId).emit('game_update', buildGameUpdatePayload(gameId, game));

    if (!game.winner) {
      // Reset inactivity timer for next player
      startInactivityTimer(gameId, game.turn);
    } else {
      // Game over → clear timers
      clearTimeout(game.timeoutTimers.X);
      clearTimeout(game.timeoutTimers.O);
    }
  });

  socket.on('leave_game', ({ gameId: rawGameId }) => {
    const gameId = String(rawGameId)
    console.log(`Player ${socket.id} left game ${gameId}`)
    handlePlayerExit(gameId, socket.id, 'opponent_left');

    socket.leave(gameId)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)

    for (const roomId in games) {
      const game = games[roomId]
      if (game.players.includes(socket.id)) {
        // Allow short grace period for refresh/reconnect.
        setTimeout(() => {
          const latestGame = games[roomId];
          if (!latestGame) return;
          if (!latestGame.players.includes(socket.id)) return;

          handlePlayerExit(roomId, socket.id, 'opponent_disconnected');
        }, 5000);
      }
    }
  })
})

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
