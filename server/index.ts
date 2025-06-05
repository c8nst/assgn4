import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

interface PlayerState {
  paddleY: number;
  score: number;
}

interface GameState {
  players: { [id: string]: PlayerState };
  ball: { x: number; y: number; vx: number; vy: number };
}

const games: { [roomId: string]: GameState } = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (roomId) => {
    socket.join(roomId);
    if (!games[roomId]) {
      games[roomId] = {
        players: {},
        ball: { x: 300, y: 200, vx: 3, vy: 3 },
      };
    }
    games[roomId].players[socket.id] = { paddleY: 150, score: 0 };
    io.to(roomId).emit('gameState', games[roomId]);
  });

  socket.on('paddleMove', ({ roomId, paddleY }) => {
    if (games[roomId] && games[roomId].players[socket.id]) {
      games[roomId].players[socket.id].paddleY = paddleY;
    }
  });

  setInterval(() => {
    Object.keys(games).forEach((roomId) => {
      const game = games[roomId];
      const ball = game.ball;
      ball.x += ball.vx;
      ball.y += ball.vy;

      
      if (ball.y <= 0 || ball.y >= 400) ball.vy *= -1;

      // Reset and score logic omitted for brevity

      io.to(roomId).emit('gameState', game);
    });
  }, 1000 / 60);

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    for (const roomId in games) {
      delete games[roomId].players[socket.id];
    }
  });
});

server.listen(3001, () => console.log('Server running on port 3001'));

