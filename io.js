var SocketIO = require('socket.io');
var admin = require('./lib/admin');
var debug = require('debug')('chat');

// create socketIO server
var io = new SocketIO();

// usernames which are currently connected to the chat rooms
var usernames = {}; // double dictionary
var numUsers = {};  // dictionary
var getRooms = {};

var board = {}; // double dictionary on rooms -> post -> {body: str, score: int}

admin.on('boot', function(info) {
    debug('entered admin boot in io');
    var room = info.room;
    var nickname = info.nickname;

    if (room != undefined) {
      room = room.replace(/ /g,"").toLowerCase();
    } 

    if (usernames[room] != undefined) {
      if (usernames[room][nickname] != undefined) {
        var socket = usernames[room][nickname];
        io.to(socket.id).emit('new message',
                              {username: "admin",
                               message: "you have been booted"});
        io.to(socket.id).emit('new message',
                              {username: "admin",
                               message: "your messsages will no longer be broadcasted"});
        socket.disconnect('unauthorized');
      }
    }
});


io.on('connection', function (socket) {
  var addedUser = false;
  debug ("new connection: " + socket.id +
          "\n\t on ip: " + socket.handshake.address);


  // this function fires immediately after a connection
  socket.on('add topic', function(data) {
    //console.log("GOT ADD TOPIC");
    // remove all whitespace from the room data
    var room = data.topic.replace(/ /g,"").toLowerCase();
    socket.join(room);
    debug("socket on ip: " + socket.handshake.address + " joined: " + room);
    debug("socket on room: " + room);
    getRooms[socket.id] = room;

    //console.dir[getRooms];
  });

  socket.on('add body', function(data) {
    socket.room = getRooms[socket.id];
    var post = data.body;

    console.log(post);

    if (board[socket.room] == undefined) {
      board[socket.room] = {};
    }

    board[socket.room][post] = {body: post, score: 0};
    io.to(socket.room).emit('new body', {body: board[socket.room][post].body,
                                         score: board[socket.room][post].score});
  });

  socket.on('like body', function(data) {
    socket.room = getRooms[socket.id];
    var post = data.body;

    if (board[socket.room] != undefined) {
      if (board[socket.room][post] != undefined) {
        ++(board[socket.room][post][score]);
      }
    }
  });

  socket.on('dislike body', function(data) {
    socket.room = getRooms[socket.id];
    var post = data.body;

    if (board[socket.room] != undefined) {
      if (board[socket.room][post] != undefined) {
        ++(board[socket.room][post][score]);
      }
    }
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.room = getRooms[socket.id];
    if (data.replace(/ /g,"").toLowerCase().indexOf("fuck") > -1) {
        io.to(socket.id).emit('new message',
                              {username: "admin",
                               message: "you have been booted for indecency: please do not use f*ck."});
        io.to(socket.id).emit('new message',
                              {username: "admin",
                               message: "your messsages will no longer be broadcasted"});
        socket.disconnect('unauthorized');
    }
    else {
        socket.broadcast.to(socket.room).emit('new message', {
          username: socket.username,
          message: data
        });
    }
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

    // add the client's username to the global list & save their socket
    usernames[socket.room][socket.username] = socket;

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
