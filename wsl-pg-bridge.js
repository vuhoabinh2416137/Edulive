const net = require('net');
const { spawn } = require('child_process');

const server = net.createServer((socket) => {
  const child = spawn('wsl', ['-d', 'Ubuntu', '--', 'nc', '127.0.0.1', '5432']);

  socket.pipe(child.stdin);
  child.stdout.pipe(socket);

  socket.on('error', (err) => {
    child.kill();
  });

  child.on('error', (err) => {
    socket.destroy();
  });

  socket.on('close', () => {
    child.kill();
  });

  child.on('close', () => {
    socket.end();
  });
});

server.listen(5432, '127.0.0.1', () => {
  console.log('WSL PostgreSQL bridge listening on 127.0.0.1:5432');
});
