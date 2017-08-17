var Editor = CodeMirror(document.body, {
  value: 'loading...',
  mode:  'javascript',
  lineNumbers: true,
  theme: 'monokai',
  tabSize: 2
});

var HiddenEditor = CodeMirror($('#hiddenEditor')[0]);

$('.CodeMirror').attr('autocomplete', 'off');
$('.CodeMirror').attr('autocorrect', 'off');
$('.CodeMirror').attr('autocapitalize', 'off');
$('.CodeMirror').attr('spellcheck', 'false');

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 16; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

var socket = io();
var initialization = true;
var id = makeid();
var files = {};
var currentName = 'filename';
var entering = false;


var handleChangeFilename = function(event) {
  if (event.target.tagName == 'LI') {
    let newName = event.target.innerHTML;
    $('#name')[0].innerHTML = newName;
    files[currentName] = Editor.getValue();
    Editor.setValue(files[newName]);
    currentName = newName;
    $('#filenames').toggleClass('hide');
  }
};

function addFilename(name) {
  let newLi = document.createElement('li');
  newLi.innerHTML = name;
  newLi.onclick = handleChangeFilename;
  $('#filenames')[0].appendChild(newLi);
}

socket.on('getValue', function(data) {
  if (!initialization) {
    socket.emit('initValue', files);
  }
});

socket.on('newFile', function(data) {
  files[data] = '// ' + data + '.js';
  addFilename(data);
});

socket.on('initValue', function(data) {
  if (initialization) {
    Editor.setValue(data['filename']);
    files = data;
    initialization = false;
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      addFilename(keys[i])
    }
  }
});

socket.on('changeValue', function(data) {
  if (data.id != id) {
    let added = data.changes.text.join('\n');
    if (data.name == currentName) {
      let cursorPosition = Editor.getCursor();
      Editor.replaceRange(
        added,
        data.changes.from,
        data.changes.to,
        'setValue'
      );
      Editor.setCursor(cursorPosition);
    } else {
      HiddenEditor.setValue(files[data.name]);
      HiddenEditor.replaceRange(
        added,
        data.changes.from,
        data.changes.to,
        'setValue'
      );
      files[data.name] = HiddenEditor.getValue();
    }
  }
});

socket.on('users', function(value) {
  $('#users')[0].innerHTML = value;
});

Editor.on('change', function(event, changes) {
  if (changes.origin != 'setValue') {
    files[currentName] = Editor.getValue();
    socket.emit('changeValue', {id: id, changes: changes, name: currentName});
  }
});

socket.emit('getValue', {});

$('#filename').on('click', function() {
  $('#filenames').toggleClass('hide');
});

function addFile() {
  let newName = $('#newName')[0].innerHTML;
  if (files[newName] != undefined || newName == '' || newName == 'new...') {
    $('#newName')[0].innerHTML = 'new...';
    entering = false;
    $('#newName').addClass('grey-text');
    return;
  }
  files[currentName] = Editor.getValue();
  files[newName] = '// ' + newName + '.js';
  Editor.setValue(files[newName]);
  currentName = newName;
  $('#name')[0].innerHTML = newName;
  addFilename(newName);
  $('#filenames').toggleClass('hide');
  $('#newName').addClass('grey-text');
  $('#newName')[0].innerHTML = 'new...';
  entering = false;
  socket.emit('newFile', newName);
}

$('li img').on('click', addFile);

$('#newName').on('click', function() {
  if (!entering) {
    entering = true;
    $('#newName').removeClass('grey-text');
    $('#newName')[0].innerHTML = '';
  }
});