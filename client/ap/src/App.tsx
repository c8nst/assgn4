import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface PlayerState {
  paddleY: number;
  score: number;
}

interface GameState {
  players: { [id: string]: PlayerState };
  ball: { x: number; y: number };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');

  useEffect(() => {
    socket.emit('joinGame', 'room1');

    socket.on('yourId', (id: string) => {
      setPlayerId(id);
    });

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const movement = e.key === 'ArrowUp' ? -10 : 10;
        const newY = (gameState?.players[playerId]?.paddleY || 150) + movement;
        socket.emit('paddleMove', { roomId: 'room1', paddleY: newY });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playerId]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !gameState) return;

    ctx.clearRect(0, 0, 600, 400);
    ctx.fillStyle = 'black';
    ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);

    const players = Object.values(gameState.players) as PlayerState[];
    players.forEach((player, idx) => {
      const x = idx === 0 ? 10 : 580;
      ctx.fillRect(x, player.paddleY, 10, 60);
    });
  }, [gameState]);

  return <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid black' }} />;
}

export default App;
