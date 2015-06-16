window.Inspector = {
  attach: function(aId) {
    var el = document.getElementById(aId);
    el.innerHTML = '<ul></ul>';
    this.iterateTree(document.accessibleElement, el.firstChild);
  },

  iterateTree: function(aRoot, aUIEl)
  {
    console.log(aUIEl);
    aUIEl.innerHTML += `<li>${aRoot.role}</li>`;
    var it = aRoot.children;

    var next = it[Symbol.iterator]().next();
    if (!next.done) {
      aUIEl.innerHTML += '<ul></ul>';

      do {
        this.iterateTree(next.value, aUIEl.lastChild);
        next = it[Symbol.iterator]().next();
      } while (!next.done);
    }
  }
};
