window.Inspector = {
  attach: function(aTreeId, aPropsId) {
    var el = document.getElementById(aTreeId);
    el.innerHTML = '<ul></ul>';
    this.iterateTree(document.accessibleElement, el.firstChild);
  },

  iterateTree: function(aRoot, aUIEl)
  {
    console.log(aUIEl);
    aUIEl.innerHTML += `<li onclick='Inspector.toggleItem(event);'><span>${aRoot.role}</span></li>`;
    var it = aRoot.children;

    var next = it[Symbol.iterator]().next();
    if (!next.done) {
      aUIEl.lastChild.className = "container";
      aUIEl.innerHTML += '<ul></ul>';

      do {
        this.iterateTree(next.value, aUIEl.lastChild);
        next = it[Symbol.iterator]().next();
      } while (!next.done);
    }
  },

  toggleItem: function(aEvent) {
    // Filter clicks on list item body.
    //if (aEvent.originalTarget == aEvent.originalTarget.parentNode.lastChild)
      //return;

    console.log(aEvent.target);
    console.log('hey');
  }
};
