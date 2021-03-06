(function(){
  'use strict';

  Object.defineProperty(Node.prototype, 'a11ement', {
    get: function () {
      return A11ementFor(this);
    }
  });

  window.AccessiblePin = function(aAnchor, aRoot)
  {
    this.anchor = aAnchor;
    this.offset = 'at';
    this.root = aRoot;
    this.rootNode = aRoot.DOMNode;

    this.move = function(aWhere, aCriteria)
    {
      if (!this.anchor)
        return false;

      var critera = function(aNode) {
        var obj = A11ementFor(aNode);
        if (obj) {
          if (!(typeof aCriteria == 'function') || aCriteria.call(null, obj))
            return obj;
        }
        return null;
      }

      var res = null;
      var root = this.rootNode;
      switch (aWhere) {
        case 'forward':
          res = toNext(this.rootNode, critera, this.anchor.DOMNode,
                       (this.offset == 'after'));
          break;

        case 'backward':
          res = toPrev(this.rootNode, critera, this.anchor.DOMNode,
                       (this.offset == 'before'));
          break;

        default:
          return false;
      }

      if (res) {
        console.log('traversed: ');
        console.log(res.DOMNode);

        this.anchor = res;
        this.offset = 'at';
      }
      return !!res;
    }

    this.set = function(aAnchor, aOffset)
    {
      this.anchor = aAnchor;
      this.offset = aOffset;
    }

    function toNext(aRoot, aCriteria, aNode, aSkipKids) {
      if (aNode.firstChild && !aSkipKids) {
        return aCriteria(aNode.firstChild) ||
          toNext(aRoot, aCriteria, aNode.firstChild);
      }
      if (aNode.nextSibling) {
        return aCriteria(aNode.nextSibling) ||
          toNext(aRoot, aCriteria, aNode.nextSibling);
      }

      var node = aNode;
      while ((node = node.parentNode) && node != aRoot) {
        if (node.nextSibling) {
          return aCriteria(node.nextSibling) ||
            toNext(aRoot, aCriteria, node.nextSibling);
        }
      }
      return null;
    }

    function toPrev(aRoot, aCriteria, aNode, aSkipKids) {
      if (aNode.lastChild && !aSkipKids) {
        return aCriteria(aNode.lastChild) ||
          toPrev(aRoot, aCriteria, aNode.lastChild);
      }
      if (aNode.previousSibling) {
        return aCriteria(aNode.previousSibling) ||
          toPrev(aRoot, aCriteria, aNode.previousSibling);
      }

      var node = aNode;
      while ((node = node.parentNode) && node != aRoot) {
        if (node.previousSibling) {
          return aCriteria(node.previousSibling) ||
            toPrev(aRoot, aCriteria, node.previousSibling);
        }
      }
      return null;
    }
  }

  /**
   * Return an accessible element for the given DOM node if any.
   */
  function A11ementFor(aNode) {
    if (!aNode) {
      return null;
    }

    var sobjs = [];
    switch (aNode.nodeType) {
    case Node.DOCUMENT_NODE:
      sobjs.push({
        match: ':document',
        role: 'document'
      });
      break;

    case Node.TEXT_NODE:
      if ((aNode.previousSibling || aNode.nextSibling) &&
          /\S/.test(aNode.textContent) && aNode.parentNode.localName != 'label') {
        sobjs.push({
          match: ':textnode',
          role: 'text',
          text: ':content'
        });
      }
      break;

    default:
      match(aNode, ARIASemantics, sobjs);
      match(aNode, HTMLSemantics, sobjs);
      match(aNode, MathMLSemantics, sobjs);
    }

    if (sobjs.some(function (el) {
        return el.match != ":role";
      })) {
      return new A11ement(aNode, sobjs);
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

      var w = computeMatchWeight(aNode, sobj.match);
      if (w > weight) {
        matchByWeight = sobj;
        weight = w;
      }
    }

    if (matchByWeight) {
      aList.push(matchByWeight);
    }
  }

  function computeMatchWeight(aNode, aStr)
  {
    // Find an object whichever matches the DOM node best.
    var re =
      /(?:\:role\((\w+)\))?(?:\s*>\s*)?(?:\*|(\w+))?(?:\[(\w+)(?:\=['"](\w+)['"])?\])?/;

    var parsed = aStr.match(re);
    if (!parsed) {
      console.log(`Failed to parse the match: ${aStr}`);
      return 0;
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
        return w;
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
      } while ((parent = A11ementFor(node)));

      if (parent && parent.role === obj.role) {
        w++;
      }
    }

    return w;
  }


  /**
   * Object implementing AccessibleElement interface.
   */
  function A11ement(aNode, aSemanticsObjects) {
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

  A11ement.prototype = {
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
        var name = this.resolveTextSelector(rule);
        if (name) {
          return name;
        }
      }
      return '';
    },

    get description() {
      var rules = [];
      for (var obj of this.sobjs) {
        if ('description' in obj) {
          rules = rules.concat(obj.description);
        }
      }

      for (var rule of rules) {
        var text = this.resolveTextSelector(rule);
        if (text) {
          return text;
        }
      }
      return '';
    },

    get text() {
      var firstChild = this.children[Symbol.iterator]().next().value;
      if (firstChild) {
        return '';
      }

      var text = this.prop('text');
      if (!text) {
        return '';
      }

      var value = this.resolveTextSelector(text);
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
            if (this.resolveTextSelector(states[s])) {
              list.push(s);
            }
          }
        }
      }
      return new Set(list);
    },

    get attributes() {
      var set = new Set();
      var attrs = this.prop('attrs');
      for (var a in attrs) {
        set.add(a);
      }
      return set;
    },

    get patterns() {
      var set = new Set();
      var values = this.prop('patterns');
      for (var v in values) {
        set.add(v);
      }
      return set;
    },

    get relations() {
      var types = new Set();
      for (var obj of this.sobjs) {
        if ('rels' in obj) {
          for (var rel in obj.rels) {
            types.add(rel);
          }
        }
      }
      return types;
    },

    is: function(aProp) {
      if (aProp == this.role) {
        return true;
      }

      var states = this.prop('states');
      if (states) {
        if (typeof states[aProp] == 'function') {
          return states[aProp](this.DOMNode);
        }
        return states[aProp] && this.resolveTextSelector(states[aProp]);
      }

      return !!this.to(aProp);
    },

    get: function(aName) {
      var attrs = this.prop('attrs');
      return attrs && attrs[aName];
    },
    has: function(aName) {
      switch (aName) {
        case 'text':
          return !!this.text;
        default:
          return !!this.get(aName);
      }
      return false;
    },

    relativeOf: function(aType) {
      for (var obj of this.sobjs) {
        if ('rels' in obj) {
          var rel = obj.rels[aType];
          if (rel) {
            var selectors = typeof rel == 'string' ? [ rel ] : rel;
            for (var s of selectors) {
              var items = this.resolveNodeSelector(s);
              if (items && items[0]) {
                return items[0].a11ement;
              }
            }
          }
        }
      }
      return null;
    },

    relativeOfAll: function(aType) {
      var nodes = [];
      for (var obj of this.sobjs) {
        if ('rels' in obj) {
          var rel = obj.rels[aType];
          if (rel) {
            var selectors = typeof rel == 'string' ? [ rel ] : rel;
            for (var s of selectors) {
              var items = this.resolveNodeSelector(s);
              if (items && items[0]) {
                nodes.push(items[0].a11ement);
              }
            }
          }
        }
      }
      return nodes;
    },

    to: function (aPattern) {
      var patterns = this.prop('patterns');
      if (patterns) {
        var constructor = patterns[aPattern];
        if (constructor) {
          return constructor(this.DOMNode);
        }
      }
      return null;
    },

    get actions() {
      var set = new Set();
      var actions = this.prop('actions');
      if (actions) {
        for (var a in actions) {
          var obj = {
            name: a,
            description: a.description,
            toString: function() { return a; }
          };
          set.add(obj);
        }
      }
      return set;
    },
    activate: function (aAction, aParam) {

    },
    interactionsOf: function(aAction, aDevice) {
      var interactions = new Set();
      var actions = this.prop('actions');
      if (actions) {
        for (var a in actions) {
          if (aAction && aAction != 'any' && aAction != a) {
            continue;
          }

          for (var i of actions[a].interactions) {
            if ('match' in i && computeMatchWeight(this.DOMNode, i.match) == 0) {
              continue;
            }
            if (aDevice && aDevice != 'any' && aDevice != i.device) {
              continue;
            }

            var obj = {
              code: this.resolveTextSelector(i.code) || i.code,
              device: i.device,
              action: a,
              type: i.type,
              toString: function() { return this.code; }
            };
            interactions.add(obj);
          }
        }
      }
      return interactions;
    },

    get parent() {
      //parentNode will eventually be 'null' as we walk up the tree
      for (var parentNode = this.DOMNode.parentNode; parentNode; parentNode = parentNode.parentNode) {
        var obj = A11ementFor(parentNode);
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

          var obj = A11ementFor(this.cur);
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
    resolveTextSelector: function (aSelector) {
      var text = '';

      var nodes = this.resolveNodeSelector(aSelector);
      if (nodes) {
        // Chrome doesn't like 'for of' on NodeList.
        for (var i = 0; i < nodes.length; ++i) {
          text += nodes[i].textContent;
        }
        return text;
      }

      // :parent
      var match = aSelector.match(/\:parent\((\w+)\)/);
      if (match) {
        if (this.DOMNode.parentNode.localName === match[1]) {
          return this.DOMNode.parentNode.localName;
        }
        return '';
      }

      // :attr
      match = aSelector.match(/\:attr\((.+)\)/);
      if (match && this.DOMNode.hasAttribute(match[1])) {
        return aSelector.replace(/\:attr\((.+)\)/,
                                 this.DOMNode.getAttribute(match[1]));
      }

      // :prop
      match = aSelector.match(/\:prop\((.+)\)/);
      if (match) {
        return this.DOMNode[match[1]];
      }

      // :content
      match = aSelector.match(/\:content(?:\((.+)\))?/);
      if (match) {
        if (match[1]) {
          var text = '';
          var nodes = this.DOMNode.querySelectorAll(match[1]);
          for (var i = 0; i < nodes.length; ++i) {
            text += nodes[i].textContent;
          }
          return text;
        }
        return this.DOMNode.textContent;
      }

      return '';
    },

    resolveNodeSelector: function(aSelector) {
      // :idrefs
      var match = aSelector.match(/\:idrefs\((.+)\)/);
      if (match) {
        var nodes = [];
        if (this.DOMNode.hasAttribute(match[1])) {
          var ids = this.DOMNode.getAttribute(match[1]).split();
          for (var id of ids) {
            var el = document.getElementById(id);
            if (el) {
              nodes.push(el);
            }
          }
        }
        return nodes;
      }

      // :id
      if (aSelector.indexOf(':id') != -1 && this.DOMNode.hasAttribute('id')) {
        var selector =
          aSelector.replace(':id', `'${this.DOMNode.getAttribute('id')}'`);
        return document.querySelectorAll(selector);
      }

      try { return this.DOMNode.querySelectorAll(aSelector); }
      catch(e) { return null; }
    }
  };
}());
