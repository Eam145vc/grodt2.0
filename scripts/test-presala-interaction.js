const io = require('socket.io-client');
const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('Conectado al servidor de sockets.');

  const testData = {
    teamId: 'cuba', // Asegúrate de que este equipo exista en la presala
    avatarUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/e2f8b5a4c8b5a4f8b5a4c8b5a4f8b5a4~c5_100x100.jpeg'
  };

  console.log('Iniciando presala...');
  socket.emit('startPresala');

  setTimeout(() => {
    console.log('Asignando usuario de prueba al equipo cuba...');
    socket.emit('join-team', { userId: 'testuser', teamName: 'cuba' });
  }, 500);

  setTimeout(() => {
    console.log('Enviando evento de prueba:', testData);
    socket.emit('tiktok-event', {
      event_type: 'like',
      data: {
        user: 'testuser',
        count: 1,
        total: 1,
        avatarUrl: testData.avatarUrl
      }
    });
  }, 1000);

  setTimeout(() => {
    socket.disconnect();
    console.log('Desconectado del servidor.');
  }, 2000);
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor.');
});

socket.on('connect_error', (err) => {
  console.error('Error de conexión:', err.message);
});