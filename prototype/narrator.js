'use strict';

window.Narrator = {
  start: function () {
    Controller.init();
    this.setTo(document);
  },

  setTo: function (aRoot) {
    this.shh();

    this.root = document.accessibleElement;
    this.sayObj(this.root);
    this.say('Use down arrow key to navigate.');

    this.pin = new AccessiblePin(this.root, this.root);
  },

  next: function () {
    this.shh();

    if (this.pin.move("forward")) {
      this.sayObj(this.pin.anchor);
    } else {
      this.say('Reached the end.');
      this.pin.anchor = this.root;
    }
  },

  prev: function () {
    // Not implemented, we have to have something better than iterable for
    // children, that can be either prevSibling, nextSibling, firstChild,
    // lastChild or some tree traversal API.
    this.shh();

    if (this.pin.move("backward")) {
      this.sayObj(this.pin.anchor);
    } else {
      this.say('Reached the beginning.');
      this.pin.anchor = this.root;
    }
  },

  sayObj: function (aObj) {
    var name = aObj.name;
    if (name) {
      this.say(name);
    }

    var description = aObj.description;
    if (description) {
      this.say(description);
    }

    this.say(aObj.role);
    var text = aObj.text;
    if (text) {
      this.say(text);
    }

    var states = aObj.states;
    if (states.size > 0) {
      for (var state of states) {
        this.say(state);
      }
    }
  },

  say: function (aPhrase) {
    // Works in Chrome and other WebKit baked browsers. See console for Firefox.
    console.log('said: ' + aPhrase);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(aPhrase));
    }
  },
  shh: function () {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};


var Controller = {
  init: function () {
    document.addEventListener('keydown', this.onkey.bind(this), false);
  },

  onkey: function (aEvent) {
    var key = aEvent.key;
    if (!key) { // Chrome doesn't implement 'key' prop.
      switch (aEvent.keyCode) {
      case 38:
        key = 'ArrowUp';
        break;
      case 40:
        key = 'ArrowDown';
        break;
      }
    }

    switch (key) {
    case 'ArrowDown':
      Narrator.next();
      break;
    case 'ArrowUp':
      Narrator.prev();
      break;
    }
  }
};
