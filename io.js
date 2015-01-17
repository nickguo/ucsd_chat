var SocketIO = require('socket.io');
var pubsub = require('./lib/pubsub');
var debug = require('debug')('chat');

// create socketIO server
var io = new SocketIO();

// usernames which are currently connected to the chat rooms
var usernames = {}; // double dictionary
var numUsers = {};  // dictionary
var getRooms = {};


io.on('connection', function (socket) {
  var addedUser = false;
  debug ("new connection: " + socket.id +
          "\n\t on ip: " + socket.handshake.address);


  // this function fires immediately after a connection
  socket.on('add topic', function(data) {
    //console.log("GOT ADD TOPIC");
    // remove all whitespace from the room data
    var room = data.topic.replace(/ /g,"");
    socket.join(room);
    debug("socket on ip: " + socket.handshake.address + " joined: " + room);
    debug("socket on room: " + room);
    getRooms[socket.id] = room;

    //console.dir[getRooms];
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.room = getRooms[socket.id];
    socket.broadcast.to(socket.room).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    //console.log("GOT ADD USER");
    socket.room = getRooms[socket.id];
    // handle the case of the first user
    if (usernames[socket.room] == undefined) {
      usernames[socket.room] = {};
    }

    if (numUsers[socket.room] == undefined) {
      numUsers[socket.room] = 0;
    }

    debug("ROOM IN ADD USER IS: " + socket.room);

    // we store the username in the socket session for this client
    socket.username = username;

    if (usernames[socket.room][socket.username] != undefined) {
      io.to(socket.id).emit('invalid login', {});
      debug("INVALID LOGIN FOR: " + socket.username);
      return;
    }
    debug("continue from invalid check for: " + socket.username);

    // add the client's username to the global list
    usernames[socket.room][socket.username] = socket.username;

    //console.log("room is: " + socket.room);
    //console.dir(usernames);

    //usernames[username] = username;
    usernames[usernames.length] = username;

    ++(numUsers[socket.room]);
    addedUser = true;
    socket.emit('valid login', {
      numUsers: numUsers[socket.room]
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers[socket.room]
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.room = getRooms[socket.id];
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.room = getRooms[socket.id];
    socket.broadcast.to(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    socket.room = getRooms[socket.id];
    // remove the username from global usernames list
    if (addedUser) {
      debug("trying to delete user: " + socket.username + " - from: " + socket.room);
      debug("\t with username: " + usernames[socket.room]);

      if (usernames[socket.room] != undefined) {
        if (usernames[socket.room][socket.username] != undefined) {
          delete usernames[socket.room][socket.username];
        }
      }

      if (numUsers[socket.room] != undefined) {
        --(numUsers[socket.room]);
      }

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers[socket.room]
      });
    }
  });
});


module.exports = io;
