var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
};

/**
 * @namespace
 * The main namespace for Jake
 */
jake = new function () {

  // Private variables
  // =================
  // Local reference for scopage
  var _this = this
  // The list of tasks/prerequisites to run, parsed recursively
  // and run bottom-up, so prerequisites run first
    , _taskList = []
  // A dictionary of loaded tasks, to ensure that all tasks
  // run once and only once
   , _taskDict = {};
  // The args passed to the 'jake' invocation, after the task name

  // Private functions
  // =================
  /**
   * Crockfordian Array-test
   * @param {???} obj A value of indeterminate type that may
   * or may not be an Array
   */
  var _isArray = function (obj) {
        return obj &&
          typeof obj === 'object' &&
          typeof obj.length === 'number' &&
          typeof obj.splice === 'function' &&
          !(obj.propertyIsEnumerable('length'));
      }

    , _mixin = function (t, f) {
        for (var p in f) {
          t[p] = f[p];
        }
        return t;
      }

  /**
   * Tells us if the task has any prerequisites
   * @param {Array.<String>} prereqs An array of prerequisites
   * @return {Boolean} true if prereqs is a non-empty Array
   */
    , _taskHasDeps = function (prereqs) {
        return !!(prereqs && _isArray(prereqs) && prereqs.length);
      }

  /**
   * Handles a file task
   * @param {Error} err Error, if any, returned from fs.lstat
   * @param {fs.Stats} stats Stats obj, if any, returned from fs.lstat
   * @param {String} name The task name
   * @param {Array} prereqs The array of prerequisites, if any
   * @callback {Function} Callback for running the task
   */
    , _handleFileTask = function (name, opts, callback) {
        var err = opts.err
          , stats = opts.stats
          , prereqs = opts.prereqs
          , includeDeps = opts.includeDeps
          , subOpts = {};
        // If the task has prerequisites these are invoked in order.
        // If any of them were changed after the current file, or
        // if the current file does not exist, then push the current
        // task to the list of tasks and update the time of last change.
        if (includeDeps && _taskHasDeps(prereqs)) {
          stats = stats || {ctime: 0};
          // Clone original opts, set root to false
          _mixin(subOpts, opts);
          subOpts.root = false;
          for (var i = 0, ii = prereqs.length, prereqsLeft = prereqs.length, maxTime = stats.ctime;
              i < ii; i++) {
            _parseDeps(prereqs[i], subOpts, function (ctime) {
              prereqsLeft -= 1;
              maxTime = (maxTime == null || maxTime < ctime) ? ctime : maxTime;
              if (prereqsLeft == 0) {
                if (maxTime > stats.ctime) {
                  _taskList.push(name);
                }
                callback(maxTime);
              }
            });
          }
        }
        // If it does not have prerequisites and could not
        // be found, simply execute the task and use the
        // current time as the last time it changed.
        else if (err) {
          // File not found
          if (err.errno == 2) {
            _taskList.push(name);
            callback(new Date());
          }
          // Errors are rethrown.
          else {
            throw new Error(err.message);
          }
        }
        // No prerequisites and the file already existed, then don't
        // do anything and just return the time of last changed.
        else {
          callback(stats.ctime);
        }
      }

  /**
   * Parses all prerequisites of a task (and their prerequisites, etc.)
   * recursively -- depth-first, so prereqs run first
   * @param {String} name The name of the current task whose
   * prerequisites are being parsed.
   * @param {Object} opts -- has following options:
   *    root {Boolean}: Is this the root task of a prerequisite tree or not
   * @param {Function} [callback] Callbacks for async tasks
   */
    , _parseDeps = function (name, opts, callback) {
        var task = _this.getTask(name)
          , prereqs = task ? task.prereqs : []
          , root = opts.root
          , includeDeps = opts.includeDeps
          , subOpts = {};

        // No task found
        if (!task) {
          // If this is the root task, it's a failure if the task cannot be found.
          if (root) {
            throw new Error('Task "' + name + '" is not defined in the Jakefile.');
          }
          // If this is not the root task, we'll just assume the name is a file.
          // Search for a file instead and provide the callback with the
          // last time it changed
          fs.lstat(name, function(err, stats) {
            if (err) {
              throw new Error(err.message);
            }
            callback(stats.ctime);
          });
        }
        // The task was found
        else {
          // File task
          if (task.isFile) {
            fs.lstat(name, function(err, stats) {
              var taskOpts = {
                err: err
              , stats: stats
              , prereqs: prereqs
              , includeDeps: includeDeps
              };
              _handleFileTask(name, taskOpts, callback);
            });
          }
          // Normal task
          else {
            // If the task has prerequisites, execute those first and then
            // push the task to the task list. In case it will be used as a
            // dependancy for a file task, the last time of change is set to
            // the current time in order to force files to update as well.
            if (includeDeps && _taskHasDeps(prereqs)) {
              // Clone original opts, set root to false
              _mixin(subOpts, opts);
              subOpts.root = false;
              for (var i = 0, ii = prereqs.length, ctr = prereqs.length; i < ii; i++) {
                _parseDeps(prereqs[i], subOpts, function () {
                  ctr -= 1;
                  if (ctr == 0) {
                    _taskList.push(name);
                    callback(new Date());
                  }
                });
              }
            }
            // If the task does not have prerequisites, just push it.
            else {
              _taskList.push(name);
              callback(new Date());
            }
          }
        }
      };

  // Public properties
  // =================
  this.errorCode = undefined;
  // Name/value map of all the various tasks defined in a Jakefile.
  // Non-namespaced tasks are placed into 'default.'
  this.defaultNamespace = new Namespace('default', null);
  // For namespaced tasks -- tasks with no namespace are put into the
  // 'default' namespace so lookup code can work the same for both
  // namespaced and non-namespaced.
  this.currentNamespace = this.defaultNamespace;
  // Saves the description created by a 'desc' call that prefaces a
  // 'task' call that defines a task.
  this.currentTaskDescription = null;

  this.populateAndProcessTaskList = function (name, includeDeps, callback) {
    var opts = {
      root: true
    , includeDeps: includeDeps
    };
    // Parse all the prerequisites up front. This allows use of a simple
    // queue to run all the tasks in order, and treat sync/async essentially
    // the same.
    _parseDeps(name, opts, callback);
  };

  /**
   * Initial function called to run the specified task. Parses all the
   * prerequisites and then kick off the queue-processing
   * @param {String} name The name of the task to run
   * @param {Array} args The list of command-line args passed after
   * the task name -- may be a combination of plain positional args,
   * or name/value pairs in the form of name:value or name=value to
   * be placed in a final keyword/value object param
   */
  this.runTask = function (name, args, includeDeps) {
    this.populateAndProcessTaskList(name, includeDeps, function () {
      if (!_taskList.length) {
        _this.die('No tasks to run.');
      }
      // Kick off running the list of tasks
      _this.runNextTask(args);
    });
  };

  this.reenableTask = function (name, includeDeps) {
    var self = this;
    this.populateAndProcessTaskList(name, includeDeps, function () {
      var name
        , task;
      if (!_taskList.length) {
        _this.die('No tasks to reenable.');
      }
      else {
        while (name = (_taskList.shift())) {
          task = self.getTask(name);
          task.done = false;
        }
      }
    });
  };

  /**
   * Looks up a function object based on its name or namespace:name
   * @param {String} name The name of the task to look up
   */
  this.getTask = function (name) {
    var nameArr = name.split(':')
      , taskName = nameArr.pop()
      , ns = jake.defaultNamespace
      , currName;
    while (nameArr.length) {
      currName = nameArr.shift();
      ns = ns.childNamespaces[currName];
    }

    var task = ns.tasks[taskName];
    return task;
  };

  /**
   * Looks up a function object based on its name or namespace:name.
   * Returns null rather than throwing an exception if no such object exists.
   * @param {String} name The name of the task to look up
   */
  this.tryGetTask = function (name) {
    try {
      return this.getTask(name);
    }
    catch (e) {
      return null;
    }
  };

  /**
   * Runs the next task in the _taskList queue until none are left
   * Synchronous tasks require calling "complete" afterward, and async
   * ones are expected to do that themselves
   * TODO Add a cancellable error-throw in a setTimeout to allow
   * an async task to timeout instead of having the script hang
   * indefinitely
   */
  this.runNextTask = function (args) {
    var name = _taskList.shift()
      , task
    // If there are still tasks to run, do it
    if (name) {
      task = this.getTask(name);
      // Run tasks only once, even if it ends up in the task queue
      // multiple times
      if (task.done) {
        complete();
      }
      // Okie, we haven't done this one
      else {
        // Flag this one as done, no repeatsies
        task.done = true;

        /*
        // TODO Do this once instead of on each iteration
        parsed = this.parseArgs(this.args);
        passArgs = parsed.cmds;
        if (parsed.opts) {
          passArgs = parsed.cmds.concat(parsed.opts);
        }
        */

        // Run this mofo
        task.handler.apply(task, args || []);

        // Async tasks call this themselves
        if (!task.async) {
          complete();
        }
      }
    }
  };

  this.parseEnvVars = function (args) {
    var opts = {}
      , pat = /:|=/
      , argItems;

    for (var i = 0; i < args.length; i++) {
      argItems = args[i].split(pat);
      if (argItems.length > 1) {
        opts[argItems[0]] = argItems[1];
      }
    }
    return opts;
  };

  /**
   * Prints out a message and ends the jake program.
   * @param {String} str The message to print out before dying.
   */
  this.die = function (str) {
    console.log(str);
    process.exit();
  };

  this.parseAllTasks = function () {
    var _parseNs = function (name, ns) {
      var nsTasks = ns.tasks
        , task
        , nsNamespaces = ns.childNamespaces
        , fullName;
      // Iterate through the tasks in each namespace
      for (var q in nsTasks) {
        task = nsTasks[q];
        // Preface only the namespaced tasks
        fullName = name == 'default' ? q : name + ':' + q;
        // Save with 'taskname' or 'namespace:taskname' key
        task.fullName = fullName;
        jake.Task[fullName] = task;
      }
      for (var p in nsNamespaces) {
        fullName = name  == 'default' ? p : name + ':' + p;
        _parseNs(fullName, nsNamespaces[p]);
      }
    };

    _parseNs('default', jake.defaultNamespace);
  };
  /**
   * Displays the list of descriptions avaliable for tasks defined in
   * a Jakefile
   */
  this.showAllTaskDescriptions = function (f) {
    var maxTaskNameLength = 0
      , task
      , str = ''
      , padding
      , descr
      , filter = typeof f == 'string' ? f : null;

    for (var p in jake.Task) {
      task = jake.Task[p];
      // Record the length of the longest task name -- used for
      // pretty alignment of the task descriptions
      maxTaskNameLength = p.length > maxTaskNameLength ?
        p.length : maxTaskNameLength;
    }
    // Print out each entry with descriptions neatly aligned
    for (var p in jake.Task) {
      if (filter && p.indexOf(filter) == -1) {
        continue;
      }
      task = jake.Task[p];
      // Create padding-string with calculated length
      padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');

      descr = task.description || '(No description)';
      // Comment-colors FTW
      descr = "\033[90m # "+ descr +"\033[39m";

      console.log('jake ' + p + padding + descr);
    }
    process.exit();
  };

}();

jake.Namespace = Namespace;

module.exports = jake;
