const PORT = 3000;

var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use('/static', express.static('static'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {


  socket.on('disconnect', function() {
  });

  socket.on('getValue', function(value) {
    if (io.engine.clientsCount == 1) {
      io.emit('initValue', 'function foo() {\n\tbar();\n}\n');
    } else {
      io.emit('getValue', value);
    }
  });

  socket.on('initValue', function(value) {
    io.emit('initValue', value);
  });

  socket.on('changeValue', function(value) {
    io.emit('changeValue', value);
  });

});

http.listen(PORT, function() {
  console.log('Server listening on port', PORT)
});