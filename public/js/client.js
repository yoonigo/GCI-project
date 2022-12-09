var socket = io();

var messages = document.getElementById('messages');
var chat = document.getElementById('chat');
var chatInput = document.getElementById('chat_input');
var login = document.getElementById('login');
var usernameInput = document.getElementById('u');
var body = document.getElementById("logged-out");

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
    socket.emit('user-login', user);
    body.removeAttribute('id'); // cache le formulaire de login
    chatInput.focus();
  }
});


socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  //item.textContent = msg;
  item.innerHTML = '<span class="username">' + msg.username + ":" + '</span> ' + msg.text;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
