// Setup basic express server
var express = require('express');
var bodyParser = require('body-parser');
var admin = require('./lib/admin');
var debug = require('debug')('chat');
//var EventEmitter = require('events').EventEmitter;

// var ee = new EventEmitter();

var app = express();

// Routing -> serve static files from public folder
app.use(express.static(__dirname + '/public'));


// API example -------------------------------------

app.use(bodyParser.json());

app.post('/admin/boot', function(req,res) {
  debug('entered admin boot post');
  var body = req.body;
  admin.emit('boot', body);
  debug('finish admin boot');

  res.json({
    message: "user has been booted"
  });
});

//--------------------------------------------------

module.exports = app;
