var socket = io();

var messages = document.getElementById('messages');
var chat = document.getElementById('chat');
var chatInput = document.getElementById('chat_input');
var login = document.getElementById('login');
var usernameInput = document.getElementById('u');
var body = document.getElementById("logged-out");
var players = document.getElementById('players');
var startBtn = document.getElementById("startBtn");
var nbUsers = 0;
var pad = document.getElementById("drawing-pad");
var scoreboard_init = false;
var loggedUser;
var loggedUsers = [];
var guesser;
var clientUser;
var isGameMaster = false;

var formChat = document.getElementById('chat-form');
formChat.addEventListener('submit', function(e) {
  e.preventDefault();
  var msg = {
    text : chatInput.value
  };
  if (chatInput.value) {
    socket.emit('chat message', msg);
    chatInput.value = '';
  }
  chatInput.focus();
});

login.addEventListener('submit', function(e){
  e.preventDefault();
  var user = {
    username : usernameInput.value.trim()
  };
  if (user.username.length > 0){ // si le champ n'est pas vide
    socket.emit('user-login', user, function(success){
      if (success){
        body.removeAttribute('id'); // cache le formulaire de login
        chatInput.focus();
        document.getElementById("username").textContent = user.username;
        loggedUser = user;
        document.getElementById("login").style.display = "none";
      }
    });
  }
});

function newRound(){
  if (loggedUsers.length >= 2)
    socket.emit('new-round');
}

socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  //item.textContent = msg;
  item.innerHTML = '<span class="username">' + msg.username + ":" + '</span> ' + msg.text;
  messages.appendChild(item);
  scrollToBottom();
});

socket.on('user-login', function(param) {
  loggedUsers = param[2];
  // add all current players to the scoreboard when the user logs in
  if (scoreboard_init == false){
    var users = param[2];
    for (i = 0; i < users.length; i++){
      var item = document.createElement('li');
      item.setAttribute('id', users[i].username);
      item.innerHTML = '<span class="players">' + users[i].username + '</span> ';
      players.appendChild(item);
    }
    scoreboard_init = true;
    if (users.length == 1){
      // the user to which this client belongs is the game master aka the owner of the room
      isGameMaster = true;
      // Only the game master can start the game
      document.getElementById("startBtn").style.display = "block";
    }
    //console.log("User "+users[users.length-1].username+" is GM : "+isGameMaster);
  }else{// add the new user to the scoreboard
    var item = document.createElement('li');
    item.setAttribute('id', param[0].username);
    item.innerHTML = '<span class="players">' + param[0].username + '</span> ';
    players.appendChild(item);
  }
  pad.src = param[1];
  clientUser = param[0];
});

socket.on('user-exists', ()=>{
  var alert = document.getElementById("alertLogin");
  alert.style.display = "block";
});

socket.on('user-logout', function(param){
  var item = document.getElementById(param[0].username);
  players.removeChild(item);
  loggedUsers = param[1];

  if (loggedUsers[0].username == loggedUser.username){
    // when the game master leaves, the next player who joined after him becomes the GM
    isGameMaster = true;
    document.getElementById("startBtn").style.display = "block";
  }
  //console.log("User "+loggedUser.username+" is GM : "+isGameMaster);
});

socket.on('service-message', function (msg) {
  var item = document.createElement('li');
  item.class = msg.type;
  item.innerHTML = '<span class="information">' + msg.text + '</span> ';
  messages.appendChild(item);
  scrollToBottom();
});


socket.on('start-game', function(users){

});

socket.on('new-round', (param) => {
  let newWord = param[0];
  let users = param[1];
  let order = param[2];
  let newUrl = param[3];
  pad.src = newUrl;
  let word =  document.getElementById('word');
  word.textContent = newWord;
  loggedUsers = users;
  updateRoles(order);
  checkLoggedUserTurn(loggedUsers[order[0]]); // check if it's the turn of the user of this client to draw
  setRoleColors(loggedUsers[order[0]]);
  document.getElementById('word').style.display = "block";
});

function updateRoles(order){
  for (i = 0; i < loggedUsers.length; i++){
    var player = document.getElementById(loggedUsers[i].username);
    if (loggedUsers[i].role == "guesser"){ //Afficher "Guesser" devant le nom
      guesser = loggedUsers[i];
      player.innerHTML = '<span class="players">' + loggedUsers[i].username + '</span> <span class="guesser">Guesser</span>';
      if (loggedUser.username == guesser.username){
        let word =  document.getElementById('word');
        var temp = "";
        for ( j = 0; j < word.textContent.length; j ++){
          if (word.textContent[j] == "-"){
            temp += "-"
          }else if (word.textContent[j] != " "){
            temp+="_ ";
          }else{
            temp += "\xa0\xa0\xa0";
          }
        }
        word.textContent = temp;
      }
    } else {   //pour chaque drawer, afficher son ordre de passage sur le scoreboard
      player.innerHTML = '<span class="players">' + loggedUsers[i].username + '</span> <span class="drawer">Drawer #'+(order.indexOf(i)+1)+'</span>';
    }
  }
}

socket.on('timer', function(countdown) { //update the timer
  let timer = document.getElementById("timer");
  timer.textContent = countdown;
});

socket.on('turn-end', function(nextDrawer){
  checkLoggedUserTurn(nextDrawer);
  // TODO changer le CSS du scoreboard pour mettre en avant le nouveau dessinateur
  setRoleColors(nextDrawer);
});

socket.on('round-end', () => {
  if (isGameMaster) newRound();
});

socket.on('correct answer', () => {
  // change the color of the answer in the chat
  messages.lastChild.style.color = "green";
  if (isGameMaster) newRound();
});

function setRoleColors(nextDrawer){
  for(i = 0; i < loggedUsers.length; i++){
    var user = document.getElementById(loggedUsers[i].username);
    if (loggedUsers[i].role == "guesser")user.style.color = "DarkOrange";
    else user.style.color = "black";
  }
  var drawer = document.getElementById(nextDrawer.username);
  drawer.style.color = "#3d6ada";
}

function checkLoggedUserTurn(user){
  //console.log(loggedUser.username + " is checking");
  var block = document.getElementById("blank");
  if (user.username == loggedUser.username){
    // enable the pad --> the user can draw
    //console.log("enabling");
    block.style.display = "none";
    document.getElementById("username").style.background = "#3d6ada";
  } else if (block.style.display == "none"){
    // disable the pad --> the user can't draw
    //console.log("disabling");
    block.style.display = "block";
    document.getElementById("username").style.background = "#a9a8ad";
  }
  if (guesser.username == loggedUser.username)
    document.getElementById("username").style.background = "DarkOrange";
}

function scrollToBottom() {
  chat.scrollTo(0, chat.scrollHeight);
}
