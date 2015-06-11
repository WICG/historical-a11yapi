(function(){
  'use strict';
  Object.defineProperty(Node.prototype, 'a11eObject', {
    get: function () {
      return a11eObjectFor(this);
    }
  });

  /**
   * Return an accessible object for the given DOM node if any.
   */
  function a11eObjectFor(aNode) {
    if (!aNode) {
      return null;
    }

    var sobjs = [];
    if (aNode.nodeType === Node.DOCUMENT_NODE) {
      sobjs.push({
        match: ':document',
        role: 'document'
      });
    } else {
      match(aNode, ARIASemantics, sobjs);
      match(aNode, HTMLSemantics, sobjs);
    }

    if (sobjs.some(function (el) {
        return el.match != ":role";
      })) {
      console.log('traversed: ' + aNode + ', matched: ');
      sobjs.forEach(console.log.bind(console));
      return new A11eObj(aNode, sobjs);
    }

    return null;
  }


  /**
   * Finds match objects describing the semantics of the given DOM node.
   */
  function match(aNode, aSemanticsScope, aList) {
    var weight = 0;
    var matchByWeight = null;

    for (var key in aSemanticsScope) {
      var sobj = aSemanticsScope[key];

      // A global, applies to all DOM nodes.
      if (sobj.match === ':role') {
        aList.unshift(sobj);
        continue;
      }

      // Find an object whichever matches the DOM node best.
      var re =
        /(?:\:role\((\w+)\))?(?:\s*>\s*)?(?:\*|(\w+))?(?:\[(\w+)(?:\='(\w+)')?\])?/;

      var parsed = sobj.match.match(re);
      if (!parsed) {
        console.log(`Failed to parse the match: ${sobj.match}`);
      }

      var obj = {
        role: parsed[1],
        tag: parsed[2],
        attr: parsed[3],
        attrval: parsed[4]
      };

      var w = 0;
      if (obj.tag) {
        if (obj.tag != aNode.localName) {
          continue;
        }
        w++;
      }

      if (aNode.nodeType === Node.ELEMENT_NODE && obj.attr) {
        if (obj.attrval) {
          w = aNode.getAttribute(obj.attr) === obj.attrval ? w + 2 : 0;
        } else {
          w = aNode.hasAttribute(obj.attr) ? w + 1 : 0;
        }
      }

      if (obj.role) {
        var node = aNode;
        var parent = null;
        do {
          node = node.parentNode;
        } while ((parent = a11eObjectFor(node)));

        if (parent && parent.role === obj.role) {
          w++;
        }
      }

      if (w > weight) {
        matchByWeight = sobj;
        weight = w;
      }
    }

    if (matchByWeight) {
      aList.push(matchByWeight);
    }
  }


  /**
   * Object implementing AccessibleObject interface.
   */
  function A11eObj(aNode, aSemanticsObjects) {
    this.node = aNode;
    this.sobjs = aSemanticsObjects;

    this.prop = function (aName) {
      for (var obj of this.sobjs) {
        if (aName in obj) {
          return obj[aName];
        }
      }
      return null;
    }
  }

  A11eObj.prototype = {
    get role() {
      return this.prop('role');
    },

    get name() {
      var rules = [];
      for (var obj of this.sobjs) {
        if ('name' in obj) {
          rules = rules.concat(obj.name);
        }
      }

      for (var rule of rules) {
        var name = this.resolveSelector(rule);
        if (name) {
          return name;
        }
      }
      return '';
    },

    get description() {
      var rules = [];
      for (var obj in this.sobj) {
        if ('description' in obj) {
          rules = rules.concat(obj.description);
        }
      }

      for (var rule of rules) {
        var text = this.resolveSelector(rule);
        if (text) {
          return text;
        }
      }
      return '';
    },

    get text() {
      var text = this.prop('text');
      if (!text) {
        return '';
      }

      var value = this.resolveSelector(text);
      return value ? value : text;
    },

    get states() {
      var list = [];
      var states = this.prop('states');
      if (states) {
        for (var s in states) {
          switch (typeof states[s]) {
          case 'function':
            if (states[s](this.DOMNode)) {
              list.push(s);
            }
            break;
          default:
            if (this.resolveSelector(states[s])) {
              list.push(s);
            }
          }
        }
      }
      return new Set(list);
    },

    get attributes() {},

    get patterns() {},
    toPattern: function () {},

    get actions() {},
    activate: function () {},

    get parent() {
      //parentNode will eventually be 'null' as we walk up the tree
      for (var parentNode = this.DOMNode.parentNode; parentNode; parentNode = parentNode.parentNode) {
        var obj = a11eObjectFor(parentNode);
        if (obj) {
          return obj;
        }
      }
      return null;
    },

    get children() {
      var root = this.DOMNode;
      var cur = root.firstChild;

      var iterator = {
        next: function () {
          if (!this.cur) {
            return {
              value: null,
              done: true
            };
          }

          var obj = a11eObjectFor(this.cur);
          if (!obj) {
            if (this.cur.firstChild) {
              this.cur = this.cur.firstChild;
              return this.next();
            }
          }

          if (this.cur.nextSibling) {
            this.cur = this.cur.nextSibling;
            return obj ? {
              value: obj,
              done: false
            } : this.next();
          }

          while (true) {
            this.cur = this.cur.parentNode;
            if (this.cur === this.root) {
              this.cur = null;
              return {
                value: obj,
                done: true
              };
            }

            if (this.cur.nextSibling) {
              this.cur = this.cur.nextSibling;
              return obj ? {
                value: obj,
                done: false
              } : this.next();
            }
          }

          console.log('unreached');
          throw new Error('unreached');
        },
        root: root,
        cur: cur
      };

      var iterable = {};
      iterable[Symbol.iterator] = function () {
        return iterator;
      };
      return iterable;
    },

    get DOMNode() {
      return this.node;
    },

    /**
     * Returns a text corresponding to the given text selector.
     */
    resolveSelector: function (aSelector) {
      // :idrefs
      var match = aSelector.match(/\:idrefs\((.+)\)/);
      if (match) {
        var text = '';
        if (this.DOMNode.hasAttribute(match[1])) {
          var ids = this.DOMNode.getAttribute(match[1]).split();
          for (var id of ids) {
            var el = document.getElementById('id');
            if (el) {
              text += el.textContent;
            }
          }
        }
        return text;
      }

      // :id
      if (aSelector.indexOf(':id') != -1 && this.DOMNode.hasAttribute('id')) {
        var text = '';
        var selector = aSelector.replace(':id', `'${this.DOMNode.getAttribute('id')}'`);
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; ++i) { // Chrome doesn't like 'for of' on NodeList
          text += nodes[i].textContent;
        }
        return text;
      }

      // :parent
      match = aSelector.match(/\:parent\((\w+)\)/);
      if (match) {
        if (this.DOMNode.parentNode.localName === match[1]) {
          return this.DOMNode.parentNode.localName;
        }
        return '';
      }

      // :attr
      match = aSelector.match(/\:attr\((.+)\)/);
      if (match) {
        return this.DOMNode.getAttribute(match[1]);
      }

      // :prop
      match = aSelector.match(/\:prop\((.+)\)/);
      if (match) {
        return this.DOMNode[match[1]];
      }

      // :content
      if (aSelector === ':content') {
        return this.DOMNode.textContent;
      }

      return '';
    }
  };
}());
