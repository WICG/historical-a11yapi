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

    var criteria = aCriteria && this.criterias[aCriteria];
    if (this.pin.move('forward', criteria)) {
      var el = this.pin.anchor;
      switch (el.role) {
      case 'label': // skip labels
        return this.next();

      case 'paragraph':
      {
        var hasContent = false;
        var subpin = new AccessiblePin(el, el);
        while (subpin.move('forward')) {
          this.sayObj(subpin.anchor);
          hasContent = true;
        }
        if (!hasContent) {
          this.sayObj(el);
        }
        this.pin.set(el, 'after');
        break;
      }
      default:
        this.sayObj(el);
      }
    } else {
      this.say('Reached the end.');
      this.pin.anchor = this.root;
    }
  },
  prev: function (aCriteria) {
    this.shh();

    var criteria = aCriteria && this.criterias[aCriteria];
    if (this.pin.move('backward', criteria)) {
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

    switch (aObj.role) {
      case 'heading':
        this.say(aObj.role);
        this.say(`level ${aObj.get('level')}`);
        break;

      case 'paragraph':
      case 'text':
        break;

      default:
        this.say(aObj.role);
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
