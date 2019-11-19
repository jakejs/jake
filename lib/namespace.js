
let Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
  this.rules = {};
  this.path = this.getPath();
};

Namespace.prototype = new (function () {

  this.resolveTask = function (relativeName) {
    let parts = relativeName.split(':');
    let name = parts.pop();
    let ns = this.resolveNamespace(parts.join(':'));

    return (ns && ns.tasks[name]) ||
        (this.parentNamespace &&
        this.parentNamespace.resolveTask(relativeName));
  };

  this.resolveNamespace = function (relativeName) {
    let parts = relativeName.split(':');
    let ns;

    if (!relativeName) {
      return this;
    }

    ns = this;
    for (let i = 0, ii = parts.length; ns && i < ii; i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return (ns || (this.parentNamespace &&
        this.parentNamespace.resolveNamespace(relativeName)));
  };

  this.matchRule = function (relativeName) {
    let parts = relativeName.split(':');
    parts.pop();
    let ns = this.resolveNamespace(parts.join(':'));
    let rules = ns ? ns.rules : [];
    let r;
    let match;

    for (let p in rules) {
      r = rules[p];
      if (r.match(relativeName)) {
        match = r;
      }
    }

    return (ns && match) ||
        (this.parentNamespace &&
        this.parentNamespace.matchRule(relativeName));
  };

  this.getPath = function () {
    let parts = [];
    let next = this;
    while (next) {
      parts.push(next.name);
      next = next.parentNamespace;
    }
    parts.pop(); // Remove 'default'
    return parts.reverse().join(':');
  };

})();

module.exports.Namespace = Namespace;

