var path = require('path');

var Matcher = function() {
  var resolve = function(p) {
    var split = path.basename(p).split('%');
    return {
      'dir' : path.dirname(p)
    , 'prefix' : split[0]
    , 'suffix' : split[1] };
  }

  // a is a suffix of b
  var stringEndWith = function (a,b) {
    var l;
    return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
  }

  // Replace the suffix a of the string s with b.
  var stringReplaceSuffix = function (s,a,b) {
    return s.slice(0,s.lastIndexOf(a)) + b;
  }

  // Test wether the obj matchs the pattern.
  this.match = function(pattern, obj) {
    if (pattern.indexOf('%') == -1) {
      // No Pattern. A Simple Suffix
      return stringEndWith(pattern, obj);
    } else {
      var p = resolve(pattern);

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

      if (! stringEndWith( p.suffix, filename)) {
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
  this.source = function(obj, obj_p, src_p) {
    if (obj_p.indexOf('%') == -1) {
      // No Pattern. A Simple Suffix
      var src = stringReplaceSuffix( obj, obj_p, src_p );
      return { 
        'dep'  : src
      , 'file' : src };

    } else {
      var p = resolve(obj_p);

      var filename = path.basename(obj);
      var fill = filename.slice(
        p.prefix.length, 
        filename.length - p.suffix.length);

      var src = src_p.replace('%', fill);
      return { 
        'dep'  : src
      , 'file' : src };
    }
  }
}


var Rule = function() {
  this.matcher = new Matcher();

  this.match = function(obj, args) {
    for (var p in this) {
      if (this.hasOwnProperty(p) 
        && typeof this[p] == 'object'
        && this.matcher.match(p, obj) 
      ) {
        return p;
      }
    }
    return null;
  }

  this.createTask = function(rule, obj, args) {
    var obj_p
      , src_p
      , prereqs = []
      , action
      , opts
      , rule = this[rule].rule.slice(0);  // We need a copy.

    obj_p = rule.shift();
    src_p = rule.shift();
    var src = this.matcher.source( obj, obj_p, src_p );
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
      action(obj, src.file, args);
    };

    var new_args = [obj, prereqs, new_action, opts];
    new_args.unshift('file');
    var createdTask = jake.createTask.apply(global, new_args);
    return createdTask;
  };

  
  this.showAllRuleDescriptions = function () {
    for (var p in this) {
      if (this.hasOwnProperty(p) 
        && typeof this[p] == 'object') {
        var rule = this[p].rule;
        var desc = this[p].desc || '';
        console.log( "Rule [ %s -> %s ] : %s", rule[1], rule[0], desc);
      }
    }
  };
};


exports.Rule = Rule;
