var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , TaskMixin
  , Runner = require('./visitors/runner').Runner
  , Reenabler = require('./visitors/runner').Reenabler;

/**
 * @constructor
 * A Jake task
 */
var Task = function () {
  this.constructor.prototype.initialize.apply(this, arguments);
};

Task.prototype = new EventEmitter();
Task.prototype.constructor = Task;
TaskMixin = new (function () {
  this.initialize = function (name, prereqs, action, options) {
    var opts = options || {};

    this._currentPrereqIndex = 0;

    this.name = name;
    this.prereqs = prereqs;
    this.action = action;
    this.async = false;
    this.done = false;
    this.fullName = null;
    this.desription = null;
    this.args = [];

    // Support legacy async-flag -- if not explicitly passed or falsy, will
    // be set to empty-object
    if (typeof opts == 'boolean' && opts === true) {
      this.async = true;
    }
    else {
      if (opts.async) {
        this.async = true;
      }
    }
  };

  // Run prereqs, run task
  this.invoke = function () {
    jake._invocationChain.push(this);
    this.args = Array.prototype.slice.call(arguments);
    Runner.visit(this);
  };

  // Reenable, run task (no prereqs)
  this.execute = function () {
    jake._invocationChain.push(this);
    this.reenable();
    this.run();
  };

  this.reenable = function (deep) {
    this.done = false;
    if (deep) {
      Reenabler.visit(this);
    }
  };

  this.handlePrereqComplete = function (prereq) {
    var self = this;
    this._currentPrereqIndex++;
    if (this._currentPrereqIndex < this.prereqs.length) {
      setTimeout(function () {
        Runner.visitNextPrereq(self);
      }, 0);
    }
    else {
      this.run();
    }
  };

  this.shouldRunAction = function () {
    if (this.done || typeof this.action != 'function') {
      return false
    }
    return true;
  };

  this.run = function () {
    var runAction = this.shouldRunAction();
    if (runAction) {
      this.action.apply(this, this.args);
    }
    if (!(runAction && this.async)) {
      complete();
    }
  };

  this.complete = function () {
    this.done = true;
    this.emit('complete');
  };

})();
for (var p in TaskMixin) {
  Task.prototype[p] = TaskMixin[p];
}


FileDirectoryMixin = new (function () {

  var isFileOrDirectory = function (t) {
        return (t instanceof FileTask ||
            t instanceof DirectoryTask);
      }
    , isFile = function (t) {
        return t instanceof FileTask;
      };

  this.shouldRunAction = function () {
    var runAction = false
      , prereqs = this.prereqs
      , prereqName
      , prereqTask;

    // No repeatsies
    if (this.done) {
      return false;
    }
    // Always-make override, just do it
    else if (jake.opts['always-make']) {
      return true;
    }

    // We need either an existing file, or an action to create one.
    // Try grabbing the actual mod-time of the file, then fall back
    // to looking for an action
    try {
      this.updateModTime();
    }
    catch(e) {
      if (typeof this.action == 'function') {
        return true;
      }
      else {
        throw new Error('File-task ' + this.fullName + ' has no ' +
          'existing file, and no action to create one.');
      }
    }

    // Compare mod-time of all the prereqs with its mod-time
    // If any prereqs are newer, need to run the action to update
    if (prereqs.length) {
      for (var i = 0, ii = prereqs.length; i < ii; i++) {
        prereqName = prereqs[i];
        prereqTask = jake.Task[prereqName];
        // Run the action if:
        // 1. The prereq is a normal task (not file/dir)
        // 2. The prereq is a file-task with a mod-date more recent than
        // the one for this file/dir
        if (prereqTask) {
          if (!isFileOrDirectory(prereqTask) ||
              (isFile(prereqTask) && prereqTask.modTime > this.modTime)) {
            return true;
          }
        }
      }
    }
    // File/dir has no prereqs, and exists -- no need to run
    else {
      return false;
    }
  };

  this.updateModTime = function () {
    var stats = fs.statSync(this.name);
    this.modTime = stats.mtime;
  };

  this.complete = function () {
    this.updateModTime();
    this.done = true;
    this.emit('complete');
  };

})();

var FileTask = function (name, prereqs, action, opts) {
  this.modTime = null;
  this.constructor.prototype.initialize.apply(this, arguments);
};
FileTask.prototype = new Task();
FileTask.prototype.constructor = FileTask;
for (var p in FileDirectoryMixin) {
  FileTask.prototype[p] = FileDirectoryMixin[p];
}

var DirectoryTask = function (name, prereqs, action, opts) {
  this.modTime = null;
  this.constructor.prototype.initialize.apply(this, arguments);
};
DirectoryTask.prototype = new Task();
DirectoryTask.prototype.constructor = DirectoryTask;
for (var p in FileDirectoryMixin) {
  DirectoryTask.prototype[p] = FileDirectoryMixin[p];
}

exports.Task = Task;
exports.FileTask = FileTask;
exports.DirectoryTask = DirectoryTask;
