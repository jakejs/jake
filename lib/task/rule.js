var util = require('util') // Native Node util module
  , fs = require('fs')
  , path = require('path');


// a is a suffix of b
var stringEndWith = function (a,b) {
  return b.lastIndexOf(a) + a.length == b.length;
}
var stringReplaceSuffix = function (s,a,b) {
  return s.slice(0,s.lastIndexOf(a)) + b;
}


var Rule = function() {
  this.match = function(obj, args) {
    for (var property in this) {
      if (this.hasOwnProperty(property) 
        && typeof this[property] == 'object'
        && stringEndWith(property, obj)
      ) {
        return property;
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
      , rule = this[rule].slice(0);  // We need a copy.

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
};


exports.Rule = Rule;
