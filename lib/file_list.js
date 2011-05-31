try {
  var glob = require('glob');
}
catch(e) {
  fail('FileList requires glob (https://github.com/isaacs/node-glob). Try `npm install glob`.');
}

var SPECIAL_RETURN = {
      'concat': true
    , 'slice': true
    , 'filter': true
    , 'map': true
    };

var FileList = function () {
  var self = this;

  this.pendingPatterns = [];
  this.pending = true;
  this.items = [];
  this.include(arguments);

  var props = Object.getOwnPropertyNames(Array.prototype)
    , p;
  for (var i = 0, ii = props.length; i < ii; i++) {
    p = props[i];
    (function (p) {
      var special
        , arr;
      self[p] = function () {
        if (self.pending) {
          self.resolve();
        }
        if (typeof self.items[p] == 'function') {
          if (SPECIAL_RETURN[p]) {
            special = new FileList();
            special.pendingPatterns = self.pendingPatterns;
            special.pending = self.pending;
            arr = self.items[p].apply(self.items, arguments);
            special.setItems(arr);
            return special;
          }
          else {
            return self.items[p].apply(self.items, arguments);
          }
        }
        else {
          return self.items[p];
        }
      };
    })(p);
  this.constructor = FileList;
  }

};

FileList.prototype = new (function () {
  this.include = function (pats) {
    var args;
    if (arguments.length > 1 || typeof pats == 'string') {
      args = arguments;
    }
    else {
      args = pats;
    }
    for (var i = 0, ii = args.length; i < ii; i++) {
      this.pendingPatterns.push(args[i]);
    }
  };

  this.resolve = function () {
    var pat
      , matches;
    while ((pat = this.pendingPatterns.shift())) {
      matches = glob.globSync(pat);
      this.items = this.items.concat(matches);
    }
    this.pending = false;
  };

  this.setItems = function (items) {
    this.items = items;
    this.pending = false;
  };

  this.toArray = function () {
    var ret = this.slice().items.slice();
    return ret;
  };

})();

jake.FileList = FileList;
module.exports.FileList = FileList;
