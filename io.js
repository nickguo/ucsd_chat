var SocketIO = require('socket.io');
var pubsub = require('./lib/pubsub');
var debug = require('debug')('chat');

// create socketIO server
var io = new SocketIO();

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;


io.on('connection', function (socket) {
  var addedUser = false;
  debug ("new connection: " + socket.id +
          "\n\t on ip: " + socket.handshake.address + 
          "\n\t on room: " + socket.room);


  // this function fires immediately after a connection
  socket.on('add topic', function(data) {
    // remove all whitespace from the room data
    var room = data.topic.replace(/ /g,"");
    socket.join(room);
    debug("socket on ip: " + socket.handshake.address + " joined: " + room);
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});


module.exports = io;
