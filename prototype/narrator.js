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

  next: function (aCriteria) {
    this.shh();

    if (this.pin.move('forward', this.criterias[aCriteria])) {
      this.sayObj(this.pin.anchor);
    } else {
      this.say('Reached the end.');
      this.pin.anchor = this.root;
    }
  },
  prev: function (aCriteria) {
    this.shh();

    if (this.pin.move('backward', this.criterias[aCriteria])) {
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
    switch (aObj.role) {
      case 'heading':
        this.say(`level ${aObj.get('level')}`);
        break;
    };

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
  },

  criterias: {
    default: null,
    heading: function(aEl) {
      return aEl.role == 'heading' ? 'at' : 'next';
    }
  }
};


var Controller = {
  init: function () {
    document.addEventListener('keydown', this.onkey.bind(this), false);
  },

  onkey: function (aEvent) {
    console.log(aEvent.keyCode);
    var key = aEvent.key;
    if (!key) { // Chrome doesn't implement 'key' prop.
      switch (aEvent.keyCode) {
      case 38:
        key = 'ArrowUp';
        break;
      case 40:
        key = 'ArrowDown';
        break;
      case 72:
        key = 'h';
        break;
      }
    }

    switch (key) {
    case 'ArrowDown':
      Narrator.next('default');
      break;
    case 'ArrowUp':
      Narrator.prev('default');
      break;

    case 'h':
      if (aEvent.shiftKey) {
        Narrator.prev('heading');
      }
      else {
        Narrator.next('heading');
      }
    }
  }
};
