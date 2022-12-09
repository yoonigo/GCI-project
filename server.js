const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Liste des utilisateurs connectés
var users = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname +'/index.html');
});

io.on('connection', (socket) => {

/*
  // Un utilisateur se connecte ou se déconnecte
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
*/
  var loggedUser;

  // Connexion via le formulaire
  socket.on('user-login', (user) => {
    // Vérifier que le pseudo n'existe pas déjà
    var userIndex = -1;
    for (i = 0; i < users.length; i++){
      if (users[i].username === user.username){
        userIndex = i;
      }
    }

    if(user !== undefined && userIndex === -1){ // c'est ok
      console.log('user logged in : ' + user.username);
      loggedUser = user;
      users.push(loggedUser);

    }

  });

  // Réception d'un message dans le chat et réémission vers tous les utilisateurs
  socket.on('chat message', (msg) => {
    msg.username = loggedUser.username;
    io.emit('chat message', msg);
    console.log('Message from : ' + loggedUser.username);
  });

  // Commencer la partie


});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
