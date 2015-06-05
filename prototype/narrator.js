var Narrator = {
  start: function() {
    Controller.init();
    this.setTo(document);
  },

  setTo: function(aRoot) {
    this.shh();

    this.root = document.a11eObject;
    this.sayObj(this.root);
    this.say("Use down arrow key to navigate.");

    this.stack = [ this.root.children ];
  },

  next: function() {
    this.shh();

    var it = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    if (!it) {
      this.say("Reached the end.");
      return false;
    }

    var next = it[Symbol.iterator]().next();
    if (next.value) {
      this.stack.push(next.value.children);
      this.sayObj(next.value);
      return next.done;
    }

    this.stack.pop();
    return this.next();
  },

  prev: function() {
    // Not implemented, we have to have something better than iterable for
    // children, that can be either prevSibling, nextSibling, firstChild,
    // lastChild or some tree traversal API.
  },

  sayObj: function(aObj) {
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

  say: function(aPhrase) {
    // Works in Chrome and other WebKit baked browsers. See console for Firefox.
    console.log("said: " + aPhrase);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(aPhrase));
    }
  },
  shh: function() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },

  stack: [ ]
};


var Controller = {
  init: function() {
    document.addEventListener("keydown", this.onkey.bind(this), false);
  },

  onkey: function(aEvent) {
    var key = aEvent.key;
    if (!key) { // Chrome doesn't implement 'key' prop.
      switch (aEvent.keyCode) {
        case 38:
          key = "ArrowUp";
          break;
        case 40:
          key = "ArrowDown";
          break;
      }
    }

    switch (key) {
      case "ArrowDown":
        Narrator.next();
        break;
      case "ArrowUp":
        Narrator.prev();
        break;
    }
  }
};
