var path = require('path');

function Matcher() {}

// Split a task to ns and name
Matcher.prototype.split = function(task) {
  var parts = task.split(':')
  , name  = parts.pop()
  , ns    = Matcher.prototype.resolveNS( parts );
  return { 
    'name' : name,
    'ns'   : ns 
  };
}

Matcher.prototype.resolveNS = function(parts) {
  var  ns    = jake.defaultNamespace;
  for(var i = 0, l = parts.length; ns && i < l; i++) {
    ns = ns.childNamespaces[parts[i]];
  }
  return ns;
};

Matcher.prototype.resolve = function(p) {

  var task = Matcher.prototype.split(p),
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

// a is a suffix of b
Matcher.prototype.stringEndWith = function (a,b) {
  var l;
  return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
}

// Replace the suffix a of the string s with b.
Matcher.prototype.stringReplaceSuffix = function (s,a,b) {
  return s.slice(0,s.lastIndexOf(a)) + b;
}

// Test wether the obj matchs the pattern.
Matcher.prototype.match = function(pattern, obj) {
  if (pattern.indexOf('%') == -1) {
    // No Pattern. A Simple Suffix
    return Matcher.prototype.stringEndWith(pattern, obj);
  } else {
    var p = Matcher.prototype.resolve(pattern);

    var task = Matcher.prototype.split(obj),
        name  = task.name,
        ns    = task.ns;
    obj = name;

    // Namespace is already matched.

    // Check dirname
    if (path.dirname(obj) != p.dir)
      return false;

    var filename = path.basename(obj);

    // Check file name length.
    if (p.prefix.length + p.suffix.length + 1 
    > filename.length) {
      // Length does not match.
      return false;
    }

    if (filename.indexOf(p.prefix) != 0) {
      return false;
    }

    if (! Matcher.prototype.stringEndWith( p.suffix, filename)) {
      return false;
    }

    return true;
  }
}

// Generate the source based on
//  - obj    objective
//  - obj_p  objective_pattern
//  - src_p  src_pattern
//
// Return the source with properties
//  - dep    the dependence of source
//  - file   the file name of source
//
Matcher.prototype.source = function(obj, obj_p, src_p) {
  if (obj_p.indexOf('%') == -1) {
    // No Pattern. A Simple Suffix
    var src = Matcher.prototype.stringReplaceSuffix( obj, obj_p, src_p );
    return { 
      'dep'  : src
    , 'file' : src 
    };

  } else {
    var p = Matcher.prototype.resolve(obj_p);

    var parts = obj.split(':');
    obj  = parts.pop();
    var ns    = Matcher.prototype.resolveNS( parts );

    var filename = path.basename(obj);
    var fill = filename.slice(
      p.prefix.length, 
      filename.length - p.suffix.length
    );

    var src = src_p.replace('%', fill);
    if (parts.length == 0) {
      return { 
        'dep'  : src
      , 'file' : src };
    } else {
      // Add namespace to the dependency of source file
      var dep = parts.join(':') + ':' + src;
      return { 
        'dep'  : dep
        , 'file' : src 
      };
    }
  }
}



function Rule() {}

Rule.prototype.match = function(obj, args) {
  var task = Matcher.prototype.split(obj),
     name  = task.name,
     ns    = task.ns;

  if (ns == null) return null;
  
  var rules = ns.rules;
  for (var p in rules) {
      if (rules.hasOwnProperty(p) 
      && typeof rules[p] == 'object'
      && Matcher.prototype.match(p, obj) 
      ) {
        return p;
      }
  }
  return null;
}

Rule.prototype.createTask = function(pattern, obj, args) {
  var obj_p
  , src_p
  , prereqs = []
  , action
  , opts;

  var task = Matcher.prototype.split(obj)
  ,  name  = task.name
  ,  ns    = task.ns;
  
  var rule = ns.rules[pattern].rule.slice(0);  // We need a copy.

  obj_p = rule.shift();
  src_p = rule.shift();
  var src = Matcher.prototype.source( obj, obj_p, src_p );
  // src.dep  is the the dependence with namespace.
  // src.file is the source file.

  if (Array.isArray(rule[0])) {
    prereqs = rule.shift().slice(0); // again, a copy
  }
  prereqs.unshift( src.dep );

  while ((arg = rule.shift())) {
    if (typeof arg == 'function') {
      action = arg;
    }
    else {
      opts = arg;
    }
  }

  var new_action = function() { 
    action(name, src.file, args);
  };

  var new_args = [name, prereqs, new_action, opts];
  new_args.unshift('file');

  // since createTask store the task as currentNameTask
  // here we temporariliy switch the namespace.
  var t_ns = jake.currentNamespace;
  jake.currentNamespace = ns; 
  var createdTask = jake.createTask.apply(global, new_args);
  jake.currentNamespace = t_ns;

  return createdTask;
};

  
  //this.showAllRuleDescriptions = function () {
  //  for (var p in this) {
  //    if (this.hasOwnProperty(p) 
  //      && typeof this[p] == 'object') {
  //      var rule = this[p].rule;
  //      var desc = this[p].desc || '';
  //      console.log( "Rule [ %s -> %s ] : %s", rule[1], rule[0], desc);
  //    }
  //  }
  //};


exports.Rule = Rule;
