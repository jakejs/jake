var path = require('path')
  , Matcher
  , rule
  , Rule;

// Define a helper object with some utility functions
Matcher = new (function () {

  // Split a task to two parts, name space and task name.
  // For example, given 'foo:bin/a%.c', return an object with
  // - 'ns'     : foo
  // - 'name'   : bin/a%.c
  this.split = function(task) {
    var parts = task.split(':')
    , name  = parts.pop()
    , ns    = this.resolveNS( parts );
    return {
      'name' : name,
      'ns'   : ns
    };
  };

  // Return the namespace based on an array of names.
  // For example, given ['foo', 'baz' ], return the namespace
  //
  //   default -> foo -> baz
  //
  // where default is the global root namespace
  // and -> means child namespace.
  this.resolveNS = function(parts) {
    var  ns    = jake.defaultNamespace;
    for(var i = 0, l = parts.length; ns && i < l; i++) {
      ns = ns.childNamespaces[parts[i]];
    }
    return ns;
  };

  // Given a pattern p, say 'foo:bin/a%.c'
  // Return an object with
  // - 'ns'     : foo
  // - 'dir'    : bin
  // - 'prefix' : a
  // - 'suffix' : .c
  this.resolve = function(p) {
    var task = this.split(p),
        name  = task.name,
        ns    = task.ns;
    var split = path.basename(name).split('%');
    return {
      ns: ns
    , dir: path.dirname(name)
    , prefix: split[0]
    , suffix: split[1]
    };
  };

  // Test whether string a is a suffix of string b
  this.stringEndWith = function (a,b) {
    var l;
    return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
  };

  // Replace the suffix a of the string s with b.
  // Note that, it is assumed a is a suffix of s.
  this.stringReplaceSuffix = function (s,a,b) {
    return s.slice(0,s.lastIndexOf(a)) + b;
  };

  // Test wether the a prerequisite matchs the pattern.
  // The arg 'pattern' does not have namespace as prefix.
  // For example, the following tests are true
  //
  //   pattern      |    name
  //   bin/%.o      |    bin/main.o
  //   bin/%.o      |    foo:bin/main.o
  //
  // The following tests are false (trivally)
  //
  //   pattern      |    name
  //   bin/%.o      |    foobin/main.o
  //   bin/%.o      |    bin/main.oo
  this.match = function(pattern, name) {
    var p
      , task
      , name
      , ns
      , obj
      , filename;

    if (pattern instanceof RegExp) {
      return pattern.test(name);
    }
    else if (pattern.indexOf('%') == -1) {
      // No Pattern. No Folder. No Namespace.
      // A Simple Suffix Rule. Just test suffix
      return this.stringEndWith(pattern, name);
    }
    else {
      // Resolve the dir, prefix and suffix of pattern
      p = this.resolve(pattern);

      // Resolve the namespace and task-name
      task = this.split(name);
      name = task.name;
      ns = task.ns;

      // Set the objective as the task-name
      obj = name;

      // Namespace is already matched.

      // Check dir
      if (path.dirname(obj) != p.dir) {
        return false;
      }

      filename = path.basename(obj);

      // Check file name length.
      if ((p.prefix.length + p.suffix.length + 1) > filename.length) {
        // Length does not match.
        return false;
      }

      // Check prefix
      if (filename.indexOf(p.prefix) !== 0) {
        return false;
      }

      // Check suffix
      if (!this.stringEndWith(p.suffix, filename)) {
        return false;
      }

      // OK. Find a match.
      return true;
    }
  };

  // Generate the source based on
  //  - name    name for the synthesized task
  //  - objP    pattern for the objective
  //  - srcP    pattern for the source
  //
  // Return the source with properties
  //  - dep      the prerequisite of source
  //             (with the namespace)
  //
  //  - file     the file name of source
  //             (without the namespace)
  //
  // For example, given
  //
  //  - name   foo:bin/main.o
  //  - objP    bin/%.o
  //  - srcP    src/%.c
  //
  // return {
  //    'dep' : 'foo:src/main.c',
  //    'file': 'src/main.c'
  //  };
  //
  this.source = function(name, objP, srcP) {
    var src
      , p
      , parts
      , obj
      , ns
      , filename
      , fill
      , dep;

    if (objP.indexOf('%') == -1) {
      // A Simple Suffix
      src = this.stringReplaceSuffix(name, objP, srcP);
      return {
        dep: src
      , file: src
      };
    }
    else {
      // Resolve the dir, prefix and suffix of pattern
      p = this.resolve(objP);

      // Resolve the namespace and task name
      parts = name.split(':');
      obj = parts.pop();
      ns = this.resolveNS( parts );

      filename = path.basename(obj);

      // Resolve the matching pattern for the symbol '%'
      fill = filename.slice(p.prefix.length,
          filename.length - p.suffix.length);

      // Replace the % with the mathcing pattern
      // found in last step
      src = srcP.replace('%', fill);

      // Construct the return object
      if (parts.length === 0) {
        // no name space
        return {
          dep: src
        , file: src
        };
      }
      else {
        // Prepend the namespace name
        dep = parts.join(':') + ':' + src;
        return {
          dep: dep
        , file: src
        };
      }
    }
  };

})();


Rule = function (opts) {
  this.pattern = opts.pattern;
  this.source = opts.source;
  this.prereqs = opts.prereqs;
  this.action = opts.action;
  this.opts = opts.opts;
  this.desc =  opts.desc;
  this.ns = opts.ns;
};

Rule.prototype = new (function () {
  // Create a file task based on this rule for the specified
  // task-name
  // ======
  // FIXME: Right now this just throws away any passed-in args
  // for the synthsized task (taskArgs param)
  // ======
  this.createTask = function(fullName, taskArgs) {
    var pattern
    , source
    , prereqs = []
    , arg
    , action
    , opts
    , task
    , name
    , ns
    , args
    , src
    , tNs
    , createdTask;

    // Resolve the task name and namespace for the prerequisite.
    task = Matcher.split(fullName);
    name = task.name;
    ns = task.ns;

    pattern = this.pattern;
    source = this.source

    // Resolve the prerequisite and file name representing the source
    src = Matcher.source(fullName, pattern, source);
    // - src.dep  is the prerequisite with namespace.
    // - src.file is the source file name.

    // Generate the prerequisite for the matching task.
    //    It is the original prerequisites plus the prerequisite
    //    representing source file, i.e.,
    //
    //      rule( '%.o', '%.c', ['some.h'] ...
    //
    //    If the objective is main.o, then new task should be
    //
    //      file( 'main.o', ['main.c', 'some.h' ] ...
    prereqs = this.prereqs;
    prereqs.unshift(src.dep);

    action = this.action;
    opts = this.opts;

    // Insert the file task into Jake
    //
    // Since createTask function stores the task as a child task
    // of currentNamespace. Here we temporariliy switch the namespace.
    tNs = jake.currentNamespace;
    jake.currentNamespace = ns;
    createdTask = jake.createTask('file', name, prereqs, action, opts);
    createdTask.source = src.file;
    jake.currentNamespace = tNs;

    return createdTask;
  };

})();

rule = new (function () {
  // The steps are
  // 1. Resolve the task name and namespace for the synthesized task
  // 2. Fetch all the rules belonging to the namespace.
  // 3. Test each pattern.
  this.match = function(name) {
    var task = Matcher.split(name)
      , ns = task.ns
      , rules
      , r;

    if (!ns) {
      return null;
    }

    rules = ns.rules;

    for (var p in rules) {
      r = rules[p];
      if (!r instanceof Rule) {
        throw new Error('Entries in a namespace\'s rules must be a Rule.');
      }
      if (Matcher.match(r.pattern, name)) {
        return r;
      }
    }
    return null;
  };

})();

rule.Rule = Rule;

module.exports = rule;
