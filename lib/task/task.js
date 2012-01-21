var fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , Task
  , TaskBase
  , utils = require('../utils');

/**
 * @constructor
 * A Jake task
 */
Task = function () {
  this.constructor.prototype.initialize.apply(this, arguments);
};

Task.prototype = new EventEmitter();
Task.prototype.constructor = Task;
TaskBase = new (function () {

  // Parse any positional args attached to the task-name
  var parsePrereqName = function (name) {
        var taskArr = name.split('[')
          , taskName = taskArr[0]
          , taskArgs = [];
        if (taskArr[1]) {
          taskArgs = taskArr[1].replace(/\]$/, '');
          taskArgs = taskArgs.split(',');
        }
        return {
          name: taskName
        , args: taskArgs
        };
      };

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
    this.runPrereqs();
  };

  // Reenable, run task (no prereqs)
  this.execute = function () {
    jake._invocationChain.push(this);
    this.reenable();
    this.run();
  };

  this.runPrereqs = function () {
    if (this.prereqs && this.prereqs.length) {
      this.nextPrereq();
    }
    else {
      this.run();
    }
  };

  this.nextPrereq = function () {
    var self = this
      , index = this._currentPrereqIndex
      , name = this.prereqs[index]
      , prereq
      , parsed
      , filePath
      , stats;
    if (name) {
      parsed = parsePrereqName(name);
      prereq = jake.Task[parsed.name];

      // Task doesn't exist, may be a static file
      if (!prereq) {
        filePath = name.split(':')[1] || name;
        // Create a dummy FileTask if file actually exists
        if (path.existsSync(filePath)) {
          stats = fs.statSync(filePath);
          prereq = new jake.FileTask(name);
          prereq.modTime = stats.mtime;
					// Put this dummy Task in the global Tasks list so
          // modTime will be eval'd correctly
					jake.Task[parsed.name] = prereq;
        }
        // Otherwise it's not a valid task
        else {
            throw new Error('Unknown task "' + name + '"');
        }
      }

      // Do when done
      prereq.addListener('complete', function () {
        self.handlePrereqComplete(prereq);
      });
      prereq.invoke.apply(prereq, parsed.args);
    }
  };

  this.reenable = function (deep) {
    var prereqs
      , prereq;
    this.done = false;
    if (deep) {
      prereqs = this.prereqs;
      for (var i = 0, ii = prereqs.length; i < ii; i++) {
        prereq = jake.Task[prereqs[i]];
        if (prereq) {
          prereq.reenable(deep);
        }
      }
    }
  };

  this.handlePrereqComplete = function (prereq) {
    var self = this;
    this._currentPrereqIndex++;
    if (this._currentPrereqIndex < this.prereqs.length) {
      setTimeout(function () {
        self.nextPrereq();
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
utils.mixin(Task.prototype, TaskBase);

exports.Task = Task;
