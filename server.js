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
const words = require("./words.json");

// Liste des utilisateurs connectés
var users = [];
var padUrl= "";
var usedWords = [];
var order = [];
var countUsers = 0;
var guesser;

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', async (_req, res) => {
  res.sendFile(__dirname +'/index.html');
  const url = "https://webstrates.cs.au.dk/new?prototype=pad&v=release";
  if (padUrl == ""){
    try {
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
      countUsers+=1;
      loggedUser = {
        username : user.username,
        number : countUsers,
        role : ""
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
      io.emit('user-logout', [loggedUser, users]);
    }
  });

  socket.on('new-round', () =>{
    // get a new pad
    getNewPad();
    // pick a new word
    randInt = Math.floor(Math.random() *words.length);
    while (usedWords.includes(words[randInt])){
      randInt = Math.floor(Math.random() *words.length);
    }
    var newWord = words[randInt];
    usedWords.push(newWord);

    // define the roles (drawers and guesser)
    var nbUsers = users.length;
    var randInt2 = Math.floor(Math.random() *nbUsers);
    order = [];
    users[randInt2].role = "guesser";
    for (i = 0; i < nbUsers; i++){
      if (i != randInt2){
        users[i].role = "drawer";
        order.push(i);
        console.log(order);
      }
    }
    // create order of drawers
    order = shuffle(order);
    console.log(order);
    //start timer
    io.emit('new-round', [newWord, users, order, padUrl]);
  });
});

async function getNewPad(){
    var previousPadUrl = padUrl;
    const url = "https://webstrates.cs.au.dk/new?prototype=pad&v=release";
    try {
      const response = await fetch(url, {
        method:'GET',
        credentials: "include",
        headers: {'Authorization': 'Basic ' + btoa('web:strate')}
      });
      if (padUrl == previousPadUrl)
        padUrl = await response.url;
      console.log("res : "+ padUrl);
    } catch (error) {
      console.log("Error : "+error);
    }
};

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});
