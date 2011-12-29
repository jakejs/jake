var EventEmitter = require('events').EventEmitter
  , TaskMixin
  , TaskVisitor = require('./task_visitor').TaskVisitor;

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
  this.initialize = function (name, prereqs, action, options, type) {
    var opts = options || {};

    this._currentPrereqIndex = 0;

    this.name = name;
    this.prereqs = prereqs;
    this.action = action;
    this.async = false;
    this.type = type;
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
    this.args = Array.prototype.slice.call(arguments);
    jake._invocationChain.push(this);
    TaskVisitor.visit(this);
  };

  // Reenable, run task (no prereqs)
  this.execute = function () {
  };

  this.reenable = function (deep) {
  };

  this.handlePrereqComplete = function (prereq) {
    this._currentPrereqIndex++;
    if (this._currentPrereqIndex < this.prereqs.length) {
      TaskVisitor.visitNextPrereq(this);
    }
    else {
      this.run();
    }
  };

  this.run = function () {
    if (!this.done && typeof this.action == 'function') {
      this.action.apply(this, this.args);
    }
    if (!this.async) {
      complete();
    }
  };

})();
for (var p in TaskMixin) {
  Task.prototype[p] = TaskMixin[p];
}

var FileTask = function (name, prereqs, action, opts, type) {
  this.constructor.prototype.initialize.apply(this, arguments);
};
FileTask.prototype = new Task();
FileTask.prototype.constructor = FileTask;

var DirectoryTask = function (name, prereqs, action, opts, type) {
  this.constructor.prototype.initialize.apply(this, arguments);
};
DirectoryTask.prototype = new Task();
DirectoryTask.prototype.constructor = DirectoryTask;

exports.Task = Task;
exports.FileTask = FileTask;
exports.DirectoryTask = DirectoryTask;
