'use struct';

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 16; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

var Storage = function(files) {
  
  this._files = files;

  this.fileExist = (name) => {
    return (this.getFile(name) != undefined)
  }

  this.getFiles = () => {
    return this._files;
  };

  this.getFile = (name) => {
    if (!this.fileExist(name)) {
      console.error('ERROR: Trying to get undefined file');
    }
    return this._files[name];
  };

  this.setFile = (name, value) => {
    if (!this.fileExist(name)) {
      console.error('ERROR: Trying to set undefined file');
    }
    this._files[name] = value;
  };

  this.addFile = (name, content) => {
    if (this.fileExist(name)) {
      console.error('ERROR: Trying to add already added file');
    } else {
      this._files[name] = content;
    }
  };
};

var Dropdown = function(storage) {
  this._tabs = [];
  this._storage = storage;
  this._entering = false;
  this._handler = (event) => {
    console.error('ERROR: Tab change handler is unset');
  };c

  this.addTab = (name) => {
    this._tabs.push(name);
    let newLi = document.createElement('li');
    newLi.innerHTML = name;
    newLi.onclick = this._handler;
    $('#filenames')[0].appendChild(newLi);
  };

  this.setTab = (name) => {
    if (this._tabs.indexOf(name) >= 0) {
      $('#selectedFileName')[0].innerHTML = name;
    } else {
      console.error('ERROR: Trying to set undefined tab');
    }
  }

  this.setHandler = (handler) => {
    this._handler = handler;
  }
  
  $('#filename').on('click', function() {
    $('#filenames').toggleClass('hide');
    $('#newNameWrapper').toggleClass('hide');
  });

  $('#addNewFile').on('click', () => {
    let newName = $('#newName')[0].innerHTML;
    $('#newName')[0].innerHTML = 'new...';
    this._entering = false;
    $('#newName').addClass('grey-text');
    if (this._storage.fileExist(newName) || newName == '' || newName == 'new...') {
      return;
    } else {
      // TODO
    }
  })
};

var Editor = function(mainEditor, hiddenEditor, storage, dropdown) {
  this._mainEditor = mainEditor;
  this._hiddenEditor = hiddenEditor;
  this._storage = storage;
  this._dropdown = dropdown;
  this._activeFileName = 'index';

  this.switchFile = (name) => {
    this._dropdown.setTab(name);
    this._mainEditor.setValue(
      this._storage.getFile(name)
    );
    this._activeFileName = name;
  };

  this._dropdown.setHandler((event) => {
    this.switchFile(event.target.innerHTML);
  });

  this.ChangesHandler = (name, changes) => {
    if (name == this._activeFileName) {
      let editor = this._mainEditor;
      let cursorPosition = editor.getCursor();
    } else {
      let cursorPosition = undefined;
      let editor = this.hiddenEditor;
    }

    let added = changes.text.join('\n');
    editor.replaceRange(
      added,
      changes.from,
      changes.to,
      'setValue'
    );

    if (cursorPosition) {
      editor.setCursor(cursorPosition);
    }

    this._files.setFile(name, editor.getValue());
  };

  this.addChangesListener = (listener) => {
    this._mainEditor.on('change', (event, changes) => {
      if (changes.origin != 'setValue') {
        listener(changes);
      }
    });
  };

  this._mainEditor.on('change', (event, changes) => {
    if (changes.origin != 'setValue') {
        this._files.setFile(
          this._activeFileName,
          this._mainEditor.getValue()
        );
      }
  });

  this.getActiveFileName = () => {
    return this._activeFileName;
  };
}

var visibleEditor = CodeMirror(document.body, {
  value: 'loading...',
  mode:  'javascript',
  lineNumbers: true,
  theme: 'monokai',
  tabSize: 2
});

var hiddenEditor = CodeMirror($('#hiddenEditor')[0]); // for apply changes
                                                      // to hidden files

$('.CodeMirror').attr('autocomplete', 'off'); // try to remove strange things
$('.CodeMirror').attr('autocorrect', 'off');  // for smartphone keyboards
$('.CodeMirror').attr('autocapitalize', 'off');
$('.CodeMirror').attr('spellcheck', 'false'); 

var socket = io();
var initialization = true; // flag for initial request
var id = makeid();

var editor = new Editor(
  visibleEditor,
  hiddenEditor,
  storage,
  dropdown
);

socket.on('initValue', function(data) { // initial response
  if (initialization) {
    initialization = false;
    var storage = new Storage(data);
    var dropdown = new Dropdown(storage);
    let files = Object.keys(data);
    for (let i = 0; i < files.length; i++) {
      dropdown.addTab(files[i]);
    }
    dropdown.setTab('index');
    var editor = new Editor(
      visibleEditor,
      hiddenEditor,
      storage,
      dropdown
    );
    editor.addChangesListener(function(changes) {
      socket.emit(
        'changeValue',
        {
          id: id,
          changes: changes,
          name: editor.getActiveFileName
        }
      )
    });
  }
});

socket.on('getValue', function(data) { // initial request
  if (!initialization) {
    socket.emit('initValue', storage.getFiles());
  }
});

socket.on('newFile', function(data) { // new file create handler
  if (data.id != id) {
    files.addFile(
      data.name,
      '// ' + data.name + '.js'
    );
    dropdown.addTab(data.name);
  }
});

socket.on('changeValue', function(data) {
  if (data.id != id) {
    editor.ChangesHandler(
      data.name,
      data.changes
    );
  }
})

socket.on('users', function(value) { // users count
  $('#users')[0].innerHTML = value;
});

socket.emit('getValue', {}); // emit initial request