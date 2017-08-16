var Editor = CodeMirror(document.body, {
  value: 'loading...',
  mode:  'javascript',
  lineNumbers: true,
  theme: 'monokai',
  tabSize: 4,
  indentWithTabs: true
});

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

socket.on('getValue', function(data) {
  if (!initialization) {
    socket.emit('initValue', Editor.getValue());
  }
});

socket.on('initValue', function(value) {
  if (initialization) {
    Editor.setValue(value)
    initialization = false;
  }
});

socket.on('changeValue', function(data) {
  if (data.id != id) {
    let cursorPosition = Editor.getCursor();

    let added = data.changes.text.join('\n');

    Editor.replaceRange(
      added,
      data.changes.from,
      data.changes.to,
      'setValue'
    );

    Editor.setCursor(cursorPosition);
  }
});

Editor.on('change', function(event, changes) {
  if (changes.origin != 'setValue') {
    socket.emit('changeValue', {id: id, changes: changes});
  }
});

socket.emit('getValue', {});