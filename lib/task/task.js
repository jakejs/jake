var fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , Task
  , TaskBase
  , utils = require('../utils');

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.Task
  @constructor
  @augments EventEmitter
  @description A Jake Task

  @param {String} name The name of the Task
  @param {Array} [prereqs] Prerequisites to be run before this task
  @param {Function} [action] The action to perform for this task
  @param {Object} [opts]
    @param {Array} [opts.asyc=false] Perform this task asynchronously.
    If you flag a task with this option, you must call the global
    `complete` method inside the task's action, for execution to proceed
    to the next task.
 */
Task = function () {
  // Do constructor-work only on actual instances, not when used
  // for inheritance
  if (arguments.length) {
    this.constructor.prototype.init.apply(this, arguments);
  }
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

  /**
    @name jake.Task#event:complete
    @event
   */

  this.init = function (name, prereqs, action, options) {
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
    this.namespace = null;

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

  /**
    @name jake.Task#invoke
    @function
    @description Runs prerequisites, then this task. If the task has already
    been run, will not run the task again.
   */
  this.invoke = function () {
    jake._invocationChain.push(this);
    this.args = Array.prototype.slice.call(arguments);
    this.runPrereqs();
  };

  /**
    @name jake.Task#reenable
    @function
    @description Runs this task, without running any prerequisites. If the task
    has already been run, it will still run it again.
   */
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
      , absolute
      , prereq
      , parsed
      , filePath
      , stats;
    
    if (name) {
      parsed = parsePrereqName(name);
      absolute = parsed.name[0] === '^';
      
      if (absolute) {
        parsed.name = parsed.name.slice(1);
        prereq = jake.Task[parsed.name];
      } else {
        prereq = this.namespace.resolve(parsed.name);
      }

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
      prereq.once('complete', function () {
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
    this._currentPrereqIndex = 0;
    this.done = true;
    this.emit('complete');
  };

})();
utils.mixin(Task.prototype, TaskBase);

exports.Task = Task;
