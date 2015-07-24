window.Inspector = {
  attach: function(aTreeEl, aPropsEl, aInspectedEl) {
    aTreeEl.innerHTML = '<ul></ul>';
    console.log(aInspectedEl.accessibleElement);
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
    console.log(aAl);
    if (this.selectedEl) {
      this.selectedEl.removeAttribute('selected');
    }
    this.selectedEl = aEvent.target;
    this.selectedEl.setAttribute('selected', 'true');

    this.propsEl.innerHTML = '';

    this.uiProp('Name', aAl.name);
    this.uiProp('Description', aAl.description);
    this.uiProp('Text', aAl.text);

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
  },

  uiProp: function(aName, aValue) {
    if (aValue) {
      this.propsEl.innerHTML += `<div>${aName}: ${aValue}</div>`;
    }
  },

  propsEl: null,
  selectedEl: null
};
