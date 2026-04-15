
var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
  this.rules = {};
  this.path = this.getPath();
};

Namespace.prototype = new (function () {

  this.resolveTask = function(relativeName) {
    var parts = relativeName.split(jake.nsSep)
      , name = parts.pop()
      , ns = this.resolveNamespace(parts.join(jake.nsSep));

    return (ns && ns.tasks[name]) ||
        (this.parentNamespace &&
        this.parentNamespace.resolveTask(relativeName));
  };

  this.resolveNamespace = function(relativeName) {
    if (!relativeName)
      return this;

    var parts = relativeName.split(jake.nsSep)
      , ns = this;
    for (var i = 0, ii = parts.length; ns && i < ii; i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return (ns || (this.parentNamespace &&
        this.parentNamespace.resolveNamespace(relativeName)));
  };

  this.matchRule = function(relativeName) {
    var parts = relativeName.split(jake.nsSep)
      , name = parts.pop()
      , ns = this.resolveNamespace(parts.join(jake.nsSep))
      , rules = ns ? ns.rules : []
      , r
      , match;

    for (var p = 0, pp = rules.length; p < pp; p++) {
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
    var parts = []
      , next = this;
    while (!!next) {
      parts.push(next.name);
      next = next.parentNamespace;
    }
    parts.pop(); // Remove 'default'
    return parts.reverse().join(jake.nsSep);
  };

})();

module.exports.Namespace = Namespace;

