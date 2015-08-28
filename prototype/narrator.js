'use strict';

window.Narrator = {
  start: function () {
    Controller.init();
    this.setTo(document);
  },

  setTo: function (aRoot) {
    this.shh();

    this.root = document.a11ement;
    this.sayObj(this.root);
    this.say('Use up/down arrow key to navigate, h for headings');

    this.pin = new AccessiblePin(this.root, this.root);
  },

  next: function (aCriteria) {
    this.shh();
    if (!this.move('forward', 'after', aCriteria)) {
      this.say('Reached the end.');
    }
  },
  prev: function (aCriteria) {
    this.shh();
    if (!this.move('backward', 'before', aCriteria)) {
      this.say('Reached the beginning.');
    }
  },

  move: function (aDir, aSkipOffset, aCriteria) {
    var criteria = aCriteria && this.criterias[aCriteria];
    if (!this.pin.move(aDir, criteria)) {
      this.pin.anchor = this.root;
      return false;
    }

    var el = this.pin.anchor;
    switch (el.role) {
    case 'label': // skip labels
      return this.move(aDir);

    case 'fraction':
      this.sayObj(el);
      this.pin.set(el, aSkipOffset);
      return true;

    case 'paragraph':
    {
      var hasContent = false;
      var tmppin = this.pin;
      this.pin = new AccessiblePin(el, el);
      while (this.move('forward', 'after', aCriteria)) {
        hasContent = true;
      }
      if (!hasContent) {
        this.sayObj(el);
      }
      this.pin = tmppin;
      this.pin.set(el, aSkipOffset);
      return true;
    }

    default:
      this.sayObj(el);
    }

    return true;
  },

  sayObj: function (aObj) {
    if (!aObj) {
      return;
    }

    var name = aObj.name;
    if (name) {
      this.say(name);
    }

    var description = aObj.description;
    if (description) {
      this.say(description);
    }

    switch (aObj.role) {
      case 'heading':
        this.say(aObj.role);
        this.say(`level ${aObj.get('level')}`);
        break;

      case 'fraction':
        this.sayObj(aObj.relativeOf('numerator'));
        this.say("over");
        this.sayObj(aObj.relativeOf('denominator'));
        break;

      case 'paragraph':
      case 'text':
        break;

      default:
        if (aObj.role) {
          this.say(aObj.role);
        }
    };

    if (aObj.is('table')) {
      var table = aObj.to("table");
      this.say(`${table.rowcount} rows, ${table.colcount} columns`);
    }
    else if (aObj.is('cell')) {
      var cell = aObj.to('cell');
      this.say(`row ${cell.rowindex}, column ${cell.colindex}`);
    }

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
    heading: function(aEl) {
      return aEl.role == 'heading';
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
      case 72:
        key = 'h';
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
