const fetch = require('node-fetch-with-proxy');
const HttpsProxyAgent = require('https-proxy-agent');
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors');

// Liste des utilisateurs connectés
var users = [];
var padUrl= "";

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', async (_req, res) => {
  res.sendFile(__dirname +'/index.html');
  //const url = "https://cors-anywhere.herokuapp.com/https://webstrates.cs.au.dk/new?prototype=pad&v=release";
  const url = "https://webstrates.cs.au.dk/new?prototype=pad&v=release";
  if (padUrl == ""){
    try {
      console.log("here");
      const response = await fetch(url, {
        method:'GET',
        credentials: "include",
        headers: {'Authorization': 'Basic ' + btoa('web:strate')}
      });
      if (padUrl == "")
        padUrl = await response.url;
      console.log("res : "+ padUrl);
    } catch (error) {
      console.log("Error : "+error);
    }
  } else {
    console.log("Existing pad : "+padUrl);
  }
});

io.on('connection', (socket) => {

  var loggedUser;

  // Connexion via le formulaire
  socket.on('user-login', (user, callback) => {
    // Vérifier que le pseudo n'existe pas déjà
    var userIndex = -1;
    for (i = 0; i < users.length; i++){
      if (users[i].username === user.username){
        userIndex = i;
      }
    }

    if(user !== undefined && userIndex === -1){ // c'est ok
      console.log('user logged in : ' + user.username);
      loggedUser = {
        username : user.username,
        number : users.length + 1
      };
      users.push(loggedUser);
      var serviceMsg = {
        text: 'User "' + loggedUser.username + '" joined the room',
        type: 'login'
      };
      io.emit('service-message', serviceMsg);
      io.emit('user-login', [loggedUser, padUrl, users]);
      callback(true);
    }else{
      io.emit('user-exists');
      callback(false);
    }
  });

  // Réception d'un message dans le chat et réémission vers tous les utilisateurs
  socket.on('chat message', (msg) => {
    msg.username = loggedUser.username;
    io.emit('chat message', msg);
    console.log('Message from : ' + loggedUser.username);
  });

  // Déconnexion d'un utilisateur
  socket.on('disconnect', function(){
    if (loggedUser !== undefined) {
      console.log('user disconnected : '+loggedUser.username);
      var serviceMsg = {
        text : 'User "'+loggedUser.username + '" left the room',
        type : 'logout'
      };
      io.emit('service-message', serviceMsg);
      //Suppression dans le Scoreboard
      var index = users.indexOf(loggedUser);
      if (index != -1){
        users.splice(index, 1);
      }
      io.emit('user-logout', loggedUser);
    }
  });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
