import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true
});

socket.on('connect', () => {
  console.log('Connected to Real-time WebSockets:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSockets');
});
