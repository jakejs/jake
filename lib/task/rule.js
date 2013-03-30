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
        var rule = this[rule];
        var obj_s = rule[0];
        var src_s = rule[1];
        var src = stringReplaceSuffix( obj, obj_s, src_s );
        var action = function() { rule[2](obj, src, args) } ;
        var opts = rule[3];
        
        var args = [obj, [src], action, opts];
        args.unshift('file');
        var createdTask = jake.createTask.apply(global, args);
        return createdTask;
  };
};


exports.Rule = Rule;
