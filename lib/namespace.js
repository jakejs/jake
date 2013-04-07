
var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
  this.rules = {};
};

Namespace.prototype = new (function () {

  this.resolveTask = function(relativeName) {
    var parts = relativeName.split(':')
      , name = parts.pop()
      , ns = this.resolveNamespace(parts.join(':'));

    return (ns && ns.tasks[name]) ||
        (this.parentNamespace &&
        this.parentNamespace.resolveTask(relativeName));
  };

  this.resolveNamespace = function(relativeName) {
    var parts = relativeName.split(':')
      , ns;

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

  this.matchRule = function(relativeName) {
    var parts = relativeName.split(':')
      , name = parts.pop()
      , ns = this.resolveNamespace(parts.join(':'))
      , rules = ns.rules
      , r
      , match;

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

})();

module.exports.Namespace = Namespace;

