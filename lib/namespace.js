const ROOT_NAMESPACE_NAME = '__rootNamespace__';

class Namespace {
  constructor(name, parentNamespace) {
    this.name = name;
    this.parentNamespace = parentNamespace;
    this.childNamespaces = {};
    this.tasks = {};
    this.rules = {};
    this.path = this.getPath();
    this.fullName = this.getFullName();

    //console.log('namespace name', this.name);
    //console.log('namespace path', this.path);
    //console.log('namespace fullName', this.fullName);
  }

  resolveTask(name) {
    // Namespaced, exact matches only
    let task;
    if (name.indexOf(':') > -1) {
      task = jake.Task[name];
    }
    // Bare task name, look on the current namespace
    // Or in top-level namespace
    else {
      task = this.tasks[name] || jake.Task[name];
    }
    return task || null;
  }


  resolveNamespace(relativeName) {
    //console.log(relativeName || 'none passed');

    if (!relativeName) {
      return this;
    }

    let parts = relativeName.split(':');
    let ns = this;

    for (let i = 0, ii = parts.length; ns && i < ii; i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return (ns || (this.parentNamespace &&
        this.parentNamespace.resolveNamespace(relativeName)));
  }

  matchRule(relativeName) {
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
  }

  getPath() {
    let parts = [];
    let next = this.parentNamespace;
    while (next) {
      parts.push(next.name);
      next = next.parentNamespace;
    }
    parts.pop(); // Remove '__rootNamespace__'
    return parts.reverse().join(':');
  }

  getFullName() {
    let path = this.path;
    path = (path && path.split(':')) || [];
    path.push(this.name);
    return path.join(':');
  }

  isRootNamespace() {
    return !this.parentNamespace;
  }
}

Namespace.ROOT_NAMESPACE_NAME = ROOT_NAMESPACE_NAME;

module.exports.Namespace = Namespace;

