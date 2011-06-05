try {
  var glob = require('glob');
}
catch(e) {
  fail('FileList requires glob (https://github.com/isaacs/node-glob). Try `npm install glob`.');
}

var ARRAY_METHODS = Object.getOwnPropertyNames(Array.prototype)
  ,  SPECIAL_RETURN = {
      'concat': true
    , 'slice': true
    , 'filter': true
    , 'map': true
    }
  , DEFAULT_IGNORE_PATTERNS = [
      /(^|[\/\\])CVS([\/\\]|$)/
    , /(^|[\/\\])\.svn([\/\\]|$)/
    , /(^|[\/\\])\.git([\/\\]|$)/
    , /\.bak$/
    , /~$/
    ];

var regexpEscape = (function() {
  var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ]
  , sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  return function (text) { return text.replace(sRE, '\\$1'); };
})();

var FileList = function () {
  var self = this;

  this.pendingAdd = [];
  this.pending = true;
  this.excludes = {};
  this.items = [];

  this.initExclude();
  this.excludes.pats = DEFAULT_IGNORE_PATTERNS.slice();
  this.include(arguments);

  var props = ARRAY_METHODS
    , p;
  for (var i = 0, ii = props.length; i < ii; i++) {
    p = props[i];
    (function (p) {
      var arr;
      self[p] = function () {
        if (self.pending) {
          self.resolve();
        }
        if (typeof self.items[p] == 'function') {
          if (SPECIAL_RETURN[p]) {
            arr = self.items[p].apply(self.items, arguments);
            return FileList.clone(self, arr);
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

FileList.clone = function (list, items) {
  var clone = new FileList();
  if (items) {
    clone.items = items;
  }
  clone.pendingAdd = list.pendingAdd;
  clone.pending = list.pending;
  for (var p in list.excludes) {
    clone.excludes[p] = list.excludes[p];
  }
  return clone;
};

FileList.prototype = new (function () {
  var globPattern = /[*?\[\{]/;

  var _addMatching = function (pat) {
        var matches = glob.globSync(pat);
        this.items = this.items.concat(matches);
      }

    , _resolveAdd = function (name) {
        if (globPattern.test(name)) {
          _addMatching.call(this, name);
        }
        else {
          this.push(name);
        }
      }

    , _calculateExclude = function () {
        var pats = this.excludes.pats
          , pat
          , excl = []
          , matches = []
          , files;

        if (!this.excludes.files) {
          this.excludes.files = {};
        }
        files = this.excludes.files;

        for (var i = 0, ii = pats.length; i < ii; i++) {
          pat = pats[i];
          if (typeof pat == 'string') {
            // Glob
            if (/[*?]/.test(pat)) {
              matches = glob.globSync(pat);
              for (var j = 0, jj = matches.length; j < jj; j++) {
                files[matches[j]] = true;
              }
            }
            // String for regex
            else {
              excl.push(regexpEscape(pat));
            }
          }
          // Regex, grab the string-representation
          else if (pat instanceof RegExp) {
            excl.push(pat.toString().replace(/^\/|\/$/g, ''));
          }
        }

       if (excl.length) {
          this.excludes.regex = new RegExp('(' + excl.join(')|(') + ')');
        }
        else {
          this.excludes.regex = /^$/;
        }
      }

    , _resolveExclude = function () {
        _calculateExclude.call(this);
        var arr
          , files = this.excludes.files
          , regex = this.excludes.regex;
        this.items = this.items.filter(function (name) {
          return !(files[name] || regex.test(name));
        });
      }

    , _parseArgs = function (pats) {
        var args;
        if (arguments.length > 1 ||
            (typeof pats == 'string' || typeof pats == 'function' || pats instanceof RegExp)) {
          args = arguments;
        }
        else {
          args = pats;
        }
        return args;
      };

  this.include = function (pats) {
    var args = _parseArgs(pats);
    for (var i = 0, ii = args.length; i < ii; i++) {
      this.pendingAdd.push(args[i]);
    }
  };

  this.exclude = function (pats) {
    var args = _parseArgs(pats)
      , arg;
    for (var i = 0, ii = args.length; i < ii; i++) {
      arg = args[i];
      if (typeof arg == 'function' && !(arg instanceof RegExp)) {
        this.excludes.funcs.push(arg);
      }
      else {
        this.excludes.pats.push(arg);
      }
    }
    if (!this.pending) {
      _resolveExclude.call(this);
    }
  };

  this.resolve = function () {
    var name;
    if (this.pending) {
      this.pending = false;
      while ((name = this.pendingAdd.shift())) {
        _resolveAdd.call(this, name);
      }
      _resolveExclude.call(this);
    }
  };

  this.toArray = function () {
    // Call slice to ensure lazy-resolution before slicing items
    var ret = this.slice().items.slice();
    return ret;
  };

  this.initExclude = function () {
    this.excludes = {
      pats: []
    , funcs: []
    , regex: null
    , files: null
    };
  };

  this.clearExclude = this.initExclude;

})();

jake.FileList = FileList;
module.exports.FileList = FileList;
