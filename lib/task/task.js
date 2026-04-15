var util = require('util') // Native Node util module
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
  , Task
  , TaskBase
  , utils = require('../utils')
  , rule; // Lazy-require this at the bottom

var UNDEFINED_VALUE;

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
    this.init.apply(this, arguments);
  }
};

util.inherits(Task, EventEmitter);

function Pool(max_running){
  var running = 0;
  var pool = [];
  var stopped = false;

  function resolver(func){
    var called = false;
    return function(){
      running--;
      setImmediate(run);
      if (!called && func){
        called = true;
        return func.apply(this, arguments);
      }
    };
  }

  function run(){
    if (stopped||pool.length<=0||running>max_running)
      return;
    for (var i=running; i<max_running; ++i){
      var task = pool.shift();
      if (!task||!task.callback)
        return;
      running++;
      task.callback(resolver(task.resolve), resolver(task.reject));
    }
  }

  this.exit = function(cb){
      stopped = true;
      if (running<=0)
          return cb();
      // Try next cycle
      setImmediate(this.exit.bind(this, cb));
  };

  this.push = function(cb, rs, rj){
    pool.push({callback: cb, resolve: rs, reject: rj});
    setImmediate(run);
  };
}

TaskBase = new (function () {

  // Parse any positional args attached to the task-name
  var parsePrereqName = function(name){
      // Should use regex
      var args = [], idx = name.indexOf('[');
      if (idx>0){
          args = name.substr(idx+1, name.indexOf(']', idx)).split(',');
          name = name.substr(0, idx);
      }
      return {name: name, args: args};
  };

  Task.threads = null;
  function is_async(base){
    var threads = parseInt(jake.program.opts.numjobs)||1;
    if (!Task.threads)
        Task.threads = new Pool(threads);
    return threads>1;
  }

  /**
    @name jake.Task#event:complete
    @event
   */

  this.init = function (name, prereqs, action, options) {
    var opts = options || {};

    this._prereqsPending = 0;

    this.name = name;
    this.action = action;
    this.taskStatus = Task.runStatuses.UNSTARTED;
    this.fullName = null;
    this.description = null;
    this.args = [];
    this.value = UNDEFINED_VALUE;
    this.namespace = null;
    this.origin = opts.origin;
    // Should initialize thread pool
    this.async = is_async();
    if (opts.async)
      this.async = opts.async;

    this._prereqs = prereqs||[];
    this.__defineGetter__('prereqs', function(){
      var pr = this._prereqs;
      if (typeof pr==='function')
        pr = pr.call(this);
      if(Array.isArray(pr) && pr.indexOf(this.name) !== -1)
        throw new Error('Cannot use prereq '+
              this.name + ' as a dependency of itself');
      delete this.prereqs;
      return this.prereqs = pr;
    });
  };

  /**
    @name jake.Task#invoke
    @function
    @description Runs prerequisites, then this task. If the task has already
    been run, will not run the task again.
   */
  this.invoke = function () {
    jake._invocationChain.push(this);
    this.emit('invoke');
    this.args = Array.prototype.slice.call(arguments);
    var prereqs = this.prereqs||[];
    this._prereqsPending = prereqs.length;
    if (this.async){
        var callback = this.prereqsComplete.bind(this);
        for (var i=0; i<prereqs.length; i++)
            this.prereqImmediate(prereqs[i], callback);
    }
    this.prereqsComplete();
  };

  /**
    @name jake.Task#execute
    @function
    @description Runs prerequisites, then this task. If the task has already
    been run, will not run the task again.
   */
  this.execute = function () {
    jake._invocationChain.push(this);
    this.args = Array.prototype.slice.call(arguments);
    this.reenable();
    this.run();
  };

  this.invokePrereq = function(name, cb) {
    if (!name)
      throw new Error('Prereq without name invoked from '+this.name);
    var parsed = parsePrereqName(name);
    var prereq = this.namespace.resolveTask(parsed.name) ||
          jake.attemptRule(name, this.namespace, 0) ||
          jake.createDummyFileTask(name, this.namespace);

    if (!prereq)
      throw new Error('Unknown task "'+name+
          '", possibly originated in: '+this.origin);

    //Test for circular invocation
    if (prereq === this) {
      cb(new Error("Cannot use prereq " + prereq.name +
          " as a dependency of itself"));
    }

    // Do when done
    if (prereq.taskStatus === Task.runStatuses.DONE) {
      //prereq already done, return
      cb(null, name);
    } else {
      //wait for complete before calling cb
      prereq.once('complete', cb.bind(null, null, name));
      //start te prereq if we are the first to encounter it
      if(prereq.taskStatus === Task.runStatuses.UNSTARTED) {
        prereq.taskStatus = Task.runStatuses.STARTED;
        this.emit('prereq', prereq);
        prereq.invoke.apply(prereq, parsed.args);
      }
    }
  };

  this.prereqImmediate = function(name, cb){
      setImmediate(this.invokePrereq.bind(this, name, cb));
  };

  /**
    @name jake.Task#reenable
    @function
    @description Reenables a task so that it can be run again.
   */
  this.reenable = function (deep) {
    var prereqs
      , prereq;
    this.taskStatus = Task.runStatuses.UNSTARTED;
    this.value = UNDEFINED_VALUE;
    if (deep && this.prereqs) {
      prereqs = this.prereqs;
      for (var i = 0, ii = prereqs.length; i < ii; i++) {
        prereq = jake.Task[prereqs[i]];
        if (prereq)
          prereq.reenable(deep);
      }
    }
  };

  this.prereqsComplete = function(err, prereq){
    if (err)
      throw err;
    if (!this._prereqsPending) {
      this.run();
    } else {
      if (!this.async) {
          var next = this.prereqs.length-this._prereqsPending;
          this.prereqImmediate(this.prereqs[next],
              this.prereqsComplete.bind(this));
      }
      this._prereqsPending--;
    }
  };

  this.isNeeded = function(){
    return this.taskStatus !== Task.runStatuses.DONE &&
      typeof this.action == 'function';
  };

  this.run = function(){
    var runAction = this.isNeeded();
    if (!runAction){
      this.emit('skip');
      return this.complete();
    }
    var self = this;
    return Task.threads.push(function(resolve, reject){
      var val;
      self.emit('start');
      try {
        if (typeof self.action == 'function')
          val = self.action.apply(self, self.args);

        if (typeof val == 'object' && typeof val.then == 'function') {
          val.then(resolve, reject);
        } else {
          resolve(val);
        }
      }
      catch (err) {
        reject(err); // Bail out, not complete
      }
    }, this.complete.bind(this), this.emit.bind(this, 'error'));
  };

  this.complete = function (val) {
    jake._invocationChain.splice(jake._invocationChain.indexOf(this), 1);

    this._prereqsPending = 0;
    this.taskStatus = Task.runStatuses.DONE;

    // If 'complete' getting called because task has been
    // run already, value will not be passed -- leave in place
    if (typeof val != 'undefined') {
      this.value = val;
    }

    this.emit('complete', this.value);
  };

})();
utils.mixin(Task.prototype, TaskBase);

Task.getBaseNamespacePath = function (fullName) {
  return fullName.split(jake.nsSep).slice(0, -1).join(jake.nsSep);
};

Task.getBaseTaskName = function (fullName) {
  return fullName.split(jake.nsSep).pop();
};

//The task is in one of three states
Task.runStatuses = {UNSTARTED: 'unstarted', DONE: 'done', STARTED: 'started'};

exports.Task = Task;

// Lazy-require
rule = require('../rule');

