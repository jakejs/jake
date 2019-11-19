
var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
  this.rules = {};
  this.path = this.getPath();
};

Namespace.prototype = new (function () {

  this.resolveTask = function (relativeName) {
    var parts = relativeName.split(':');
    var name = parts.pop();
    var ns = this.resolveNamespace(parts.join(':'));

    return (ns && ns.tasks[name]) ||
        (this.parentNamespace &&
        this.parentNamespace.resolveTask(relativeName));
  };

  this.resolveNamespace = function (relativeName) {
    var parts = relativeName.split(':');
    var ns;

    if (!relativeName) {
      return this;
    }

    ns = this;
    for (var i = 0, ii = parts.length; ns && i < ii; i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return (ns || (this.parentNamespace &&
        this.parentNamespace.resolveNamespace(relativeName)));
  };

  this.matchRule = function (relativeName) {
    var parts = relativeName.split(':');
    parts.pop();
    var ns = this.resolveNamespace(parts.join(':'));
    var rules = ns ? ns.rules : [];
    var r;
    var match;

    for (var p in rules) {
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
    var parts = [];
    var next = this;
    while (next) {
      parts.push(next.name);
      next = next.parentNamespace;
    }
    parts.pop(); // Remove 'default'
    return parts.reverse().join(':');
  };

})();

module.exports.Namespace = Namespace;

