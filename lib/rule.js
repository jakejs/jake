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
    , ns    = Matcher.resolveNS( parts );
    return {
      'name' : name,
      'ns'   : ns
    };
  }

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
    var task = Matcher.split(p),
        name  = task.name,
        ns    = task.ns;
    var split = path.basename(name).split('%');
    return {
      'ns'  : ns,
      'dir' : path.dirname(name),
      'prefix' : split[0],
      'suffix' : split[1],
    };
  }

  // Test whether string a is a suffix of string b
  this.stringEndWith = function (a,b) {
    var l;
    return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
  }

  // Replace the suffix a of the string s with b.
  // Note that, it is assumed a is a suffix of s.
  this.stringReplaceSuffix = function (s,a,b) {
    return s.slice(0,s.lastIndexOf(a)) + b;
  }

  // Test wether the a prerequisite matchs the pattern.
  // The arg 'pattern' does not have namespace as prefix.
  // For example, the following tests are true
  //
  //   pattern      |    prereq
  //   bin/%.o      |    bin/main.o
  //   bin/%.o      |    foo:bin/main.o
  //
  // The following tests are false (trivally)
  //
  //   pattern      |    prereq
  //   bin/%.o      |    foobin/main.o
  //   bin/%.o      |    bin/main.oo

  this.match = function(pattern, prereq) {
    if (pattern.indexOf('%') == -1) {
      // No Pattern. No Folder. No Namespace.
      // A Simple Suffix Rule. Just test suffix
      return this.stringEndWith(pattern, prereq);
    } else {
      // Resolve the dir, prefix and suffix of pattern
      var p = this.resolve(pattern);

      // Resolve the namespace and task name of prereq
      var task = this.split(prereq),
          name  = task.name,
          ns    = task.ns;

      // Set the objective as the task name of prereq
      var obj = name;

      // Namespace is already matched.

      // Check dir
      if (path.dirname(obj) != p.dir)
        return false;

      var filename = path.basename(obj);

      // Check file name length.
      if (p.prefix.length + p.suffix.length + 1
            > filename.length) {
        // Length does not match.
        return false;
      }

      // Check prefix
      if (filename.indexOf(p.prefix) != 0) {
        return false;
      }

      // Check suffix
      if (! this.stringEndWith( p.suffix, filename)) {
        return false;
      }

      // OK. Find a match.
      return true;
    }
  }

  // Generate the source based on
  //  - prereq   prerequisite
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
  //  - prereq   foo:bin/main.o
  //  - objP    bin/%.o
  //  - srcP    src/%.c
  //
  // return {
  //    'dep' : 'foo:src/main.c',
  //    'file': 'src/main.c'
  //  };
  //
  this.source = function(prereq, objP, srcP) {
    if (objP.indexOf('%') == -1) {
      // A Simple Suffix
      var src = this.stringReplaceSuffix( prereq, objP, srcP );
      return {
        'dep'  : src
      , 'file' : src
      };

    } else {
      // Resolve the dir, prefix and suffix of pattern
      var p = this.resolve(objP);

      // Resolve the namespace and task name
      var parts = prereq.split(':')
        , obj   = parts.pop()
        , ns    = this.resolveNS( parts );

      var filename = path.basename(obj);

      // Resolve the matching pattern for the symbol '%'
      var fill = filename.slice(
        p.prefix.length,
        filename.length - p.suffix.length
      );

      // Replace the % with the mathcing pattern
      // found in last step
      var src = srcP.replace('%', fill);

      // Construct the return object
      if (parts.length == 0) {
        // no name space
        return {
          'dep'  : src
        , 'file' : src };
      } else {
        // Add namespace to the prerequisite of source file
        var dep = parts.join(':') + ':' + src;
        return {
            'dep'  : dep
          , 'file' : src
        };
      }
    }
  }

})();


Rule = function (opts) {
  this.args = opts.args;
  this.desc =  opts.desc;
  this.ns = opts.ns;
};

rule = new (function () {
  // The steps are
  // 1. Resolve the task name and namespace for the prerequisite.
  // 2. Fetch all the rules belonging to the namespace.
  // 3. Test each pattern.
  this.match = function(prereq, args) {
    // 1.
    var task = Matcher.split(prereq),
       name  = task.name,
       ns    = task.ns;

    if (ns == null) return null;

    // 2.
    var rules = ns.rules;

    // 3.
    for (var p in rules) {
      if (rules.hasOwnProperty(p)
          && typeof rules[p] == 'object'
          && Matcher.match(p, prereq)
        ) {
          return p;
        }
    }
    return null;
  }

  // Create a file task based on the Rule.
  this.createTask = function(pattern, prereq, args) {
    var objP
    , srcP
    , prereqs = []
    , action
    , opts;

    // 1. Resolve the task name and namespace for the prerequisite.
    var task = Matcher.split(prereq)
    ,  name  = task.name
    ,  ns    = task.ns;

    // 2. Obtain the matching rule.
    var rule = ns.rules[pattern].args.slice(0);  // We need a copy.

    // 3. Obtain the pattern for the objective and source.
    objP = rule.shift();
    srcP = rule.shift();

    // 4. Resolve the prerequisite and file name representing the source
    var src = Matcher.source( prereq, objP, srcP );
    // - src.dep  is the prerequisite with namespace.
    // - src.file is the source file name.

    // 5. Generate the prerequisite for the matching task.
    //    It is the original prerequisites plus the prerequisite
    //    representing source file, i.e.,
    //
    //      rule( '%.o', '%.c', ['some.h'] ...
    //
    //    If the objective is main.o, then new task should be
    //
    //      file( 'main.o', ['main.c', 'some.h' ] ...
    if (Array.isArray(rule[0])) {
      prereqs = rule.shift().slice(0); // again, a copy
    }
    prereqs.unshift( src.dep );

    // 6. Fetch the action and opts.
    while ((arg = rule.shift())) {
      if (typeof arg == 'function') {
        action = arg;
      }
      else {
        opts = arg;
      }
    }

    // 7. Create a new action with obj and src replaced.
    var newAction = function() {
      action(name, src.file, args);
    };


    // 8. Now, create the file task.
    var newArgs = [name, prereqs, newAction, opts];
    newArgs.unshift('file');

    // 9. Insert the file task into Jake
    //
    // Since createTask function stores the task as a child task
    // of currentNamespace. Here we temporariliy switch the namespace.
    var tNs = jake.currentNamespace;
    jake.currentNamespace = ns;
    var createdTask = jake.createTask.apply(global, newArgs);
    jake.currentNamespace = tNs;

    return createdTask;
  };

})();

rule.Rule = Rule;

module.exports = rule;
