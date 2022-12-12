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
var loggedUsers = [];
var guesser;
var clientUser;

chat.addEventListener('submit', function(e) {
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
      }
    });
  }
});

function startGame(){
  //socket.emit('start-game');
  //start a round
  newRound();
  // set the timer
  //newTurn();
  // set turns
}

function newRound(){
  socket.emit('new-round');
  //pick a word on the server
  // set roles
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
});

function updateRoles(order){
  for (i = 0; i < loggedUsers.length; i++){
    var player = document.getElementById(loggedUsers[i].username);
    if (loggedUsers[i].role == "guesser"){ //Afficher "Guesser" devant le nom
      guesser = loggedUsers[i];
      player.innerHTML = '<span class="players">' + loggedUsers[i].username + '</span> <span class="guesser">Guesser</span>';
    } else {   //pour chaque drawer, afficher son ordre de passage sur le scoreboard
      player.innerHTML = '<span class="players">' + loggedUsers[i].username + '</span> <span class="drawer">Drawer #'+(order.indexOf(i)+1)+'</span>';
    }
  }
}

socket.on('timer', function(time) {
  let timer = document.getElementById("timer");
  timer.textContent = time.countdown;
})

function scrollToBottom() {
  chat.scrollTo(0, chat.scrollHeight);
}
