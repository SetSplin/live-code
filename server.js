var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use('/static', express.static('static'));

app.get('/', function(req, res) {
  console.log('render home page')
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('getValue', function(value) {
    console.log('value request');
    if (io.engine.clientsCount == 1) {
      io.emit('initValue', 'function foo() {\n\tbar();\n}\n');
    } else {
      io.emit('getValue', value);
    }
  });

  socket.on('initValue', function(value) {
    console.log('initial value response');
    io.emit('initValue', value);
  });

  socket.on('changeValue', function(value) {
    console.log('value response');
    io.emit('changeValue', value);
  });

});

http.listen(3000, function() {
  console.log('listening on *:3000');
});