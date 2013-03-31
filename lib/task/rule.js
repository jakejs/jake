
// a is a suffix of b
var stringEndWith = function (a,b) {
  var l;
  return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
}

// Replace the suffix a of the string s with new suffix b.
var stringReplaceSuffix = function (s,a,b) {
  return s.slice(0,s.lastIndexOf(a)) + b;
}


var Rule = function() {
  this.match = function(obj, args) {
    for (var p in this) {
      if (this.hasOwnProperty(p) 
        && typeof this[p] == 'object'
        && stringEndWith(p, obj)
      ) {
        return p;
      }
    }
    return null;
  }

  this.createTask = function(rule, obj, args) {
    var obj_s
      , src_s
      , prereqs = []
      , action
      , opts
      , rule = this[rule].rule.slice(0);  // We need a copy.

    obj_s = rule.shift();
    src_s = rule.shift();
    var src = stringReplaceSuffix( obj, obj_s, src_s );

    if (Array.isArray(rule[0])) {
      prereqs = rule.shift().slice(0); // again, a copy
    }
    prereqs.unshift( src );

    while ((arg = rule.shift())) {
      if (typeof arg == 'function') {
        action = arg;
      }
      else {
        opts = arg;
      }
    }

    var new_action = function() { 
      action(obj, src, args);
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
