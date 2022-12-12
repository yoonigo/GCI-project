var socket = io();

var messages = document.getElementById('messages');
var chat = document.getElementById('chat');
var chatInput = document.getElementById('chat_input');
var login = document.getElementById('login');
var usernameInput = document.getElementById('u');
var body = document.getElementById("logged-out");
var players = document.getElementById('players');
var nbUsers = 0;
var pad = document.getElementById("drawing-pad");
var scoreboard_init = false;

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


socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  //item.textContent = msg;
  item.innerHTML = '<span class="username">' + msg.username + ":" + '</span> ' + msg.text;
  messages.appendChild(item);
  scrollToBottom();
});

socket.on('user-login', function(param) {
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
    //item.textContent = msg;
    //item.innerHTML = '<span class="username"> #' + param[0].number + '</span> ' + param[0].username;
    item.setAttribute('id', param[0].username);
    item.innerHTML = '<span class="players">' + param[0].username + '</span> ';
    players.appendChild(item);
  }
  pad.src = param[1];
  //window.scrollTo(0, document.body.scrollHeight);
});

socket.on('user-exists', ()=>{
  var alert = document.getElementById("alertLogin");
  alert.style.display = "block";
});

socket.on('user-logout', function(user){
  var item = document.getElementById(user.username);
  players.removeChild(item);
});

socket.on('service-message', function (msg) {
  var item = document.createElement('li');
  item.class = msg.type;
  item.innerHTML = '<span class="information">' + msg.text + '</span> ';
  messages.appendChild(item);
  scrollToBottom();
});

function scrollToBottom() {
  chat.scrollTo(0, chat.scrollHeight);
}
