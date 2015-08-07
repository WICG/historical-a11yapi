window.Inspector = {
  attach: function(aTreeEl, aPropsEl, aInspectedEl) {
    aTreeEl.innerHTML = '<ul></ul>';
    this.iterateTree(aInspectedEl.accessibleElement, aTreeEl.firstChild);
    this.propsEl = aPropsEl;
  },

  iterateTree: function(aRoot, aUIEl)
  {
    var liEl = document.createElement('li');
    liEl.textContent = aRoot.role || 'no role';
    liEl.addEventListener('click', this.itemClicked.bind(this, aRoot));
    aUIEl.appendChild(liEl);

    var it = aRoot.children;
    var next = it[Symbol.iterator]().next();
    if (!next.done) {
      aUIEl.lastChild.className = 'container';
      aUIEl.appendChild(document.createElement('ul'));

      do {
        this.iterateTree(next.value, aUIEl.lastChild);
        next = it[Symbol.iterator]().next();
      } while (!next.done);
    }
  },

  itemClicked: function(aAl, aEvent) {
    if (this.selectedEl) {
      this.selectedEl.removeAttribute('selected');
    }
    this.selectedEl = aEvent.target;
    this.selectedEl.setAttribute('selected', 'true');

    this.propsEl.innerHTML = '';

    this.uiProp('Name', aAl.name);
    this.uiProp('Description', aAl.description);
    this.uiProp('Text', aAl.text);

    // states
    var states = aAl.states;
    if (states.size) {
      var str = '';
      var needcomma = false;
      for (var s of states.values()) {
        if (needcomma) {
          str += ', ';
        }
        str += s;
        needcomma = true;
      }
      this.uiProp('States', str);
    }

    // attributes
    var attrs = aAl.attributes;
    if (attrs.size) {
      var str = '';
      var needcomma = false;
      for (var s of attrs.values()) {
        if (needcomma) {
          str += ', ';
        }
        str += `${s}: ${aAl.get(s)}`;
        needcomma = true;
      }
      this.uiProp('Attributes', str);
    }

    // patterns
    var patterns = aAl.patterns;
    if (patterns.size) {
      var str = '';
      var needcomma = false;
      for (var v of patterns.values()) {
        if (needcomma) {
          str += ', ';
        }
        str += v;
        needcomma = true;
      }
      this.uiProp('Patterns', str);

      for (var v of patterns.values()) {
        var pattern = aAl.to(v);
        for (var p in pattern) {
          this.uiProp(p, pattern[p]);
        }
      }
    }

    // relations
    var rels = aAl.relations;
    if (rels.size) {
      var html = '<pre>Relations: ';
      for (var r of rels) {
        var als = aAl.relativeOfAll(r);
        if (als.length) {
          html += `\n\t${r}: `;
          for (var al of als) {
            html += `{ role: ${al.role}`;
            if (al.name) {
              html += `, name: ${al.name}`;
            }
            html += '}';
          }
        }
      }
      html += '</pre>';
      this.propsEl.innerHTML += html;
    }

    // actions
    var actions = aAl.actions;
    console.log(actions.size);
    if (actions.size) {
      var str = '';
      for (var a of actions) {
        str += `${a} (`;
        var interactions = aAl.interactionsOf(a);
        for (var i of interactions) {
          str += `${i.device}: ${i}; `;
        }
        str += ')';
      }
      this.uiProp("Actions", str);
    }
  },

  uiProp: function(aName, aValue) {
    if (typeof aValue != 'string' || aValue != '') {
      this.propsEl.innerHTML += `<div>${aName}: ${aValue}</div>`;
    }
  },

  propsEl: null,
  selectedEl: null
};
