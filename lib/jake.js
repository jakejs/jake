/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var jake
  , fs = require('fs')
  , path = require('path');

/**
 * @constructor
 * A Jake task
 */
var Task = function () {
  this.constructor.prototype.initialize.apply(this, arguments);
};

Task.prototype = new (function () {
  this.initialize = function (name, prereqs, action, async, type) {
    this.name = name;
    this.prereqs = prereqs;
    this.action = action;
    this.async = (async === true);
    this.type = type;
    this.done = false;
    this.fullName = null;
    this.desription = null;
  };

  this.invoke = function () {
    jake.runTask(this.fullName, arguments, true);
  };

  this.execute = function () {
    jake.reenableTask(this.fullName, false);
    jake.runTask(this.fullName, arguments, false);
  };

  this.reenable = function (deep) {
    jake.reenableTask(this.fullName, deep);
  };
})();
Task.prototype.constructor = Task;

var FileTask = function (name, prereqs, action, async, type) {
  this.constructor.prototype.initialize.apply(this, arguments);
};
FileTask.prototype = new Task();
FileTask.prototype.constructor = FileTask;

var DirectoryTask = function (name, prereqs, action, async, type) {
  this.constructor.prototype.initialize.apply(this, arguments);
};
DirectoryTask.prototype = new Task();
DirectoryTask.prototype.constructor = DirectoryTask;

var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};
};

var Invocation = function (taskName, args) {
  this.taskName = taskName;
  this.args = args;
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

    , _taskIndex = 0
    , _modTimes = {}
    , _workingTaskList = []
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
    , _taskHasPrereqs = function (prereqs) {
        return !!(prereqs && _isArray(prereqs) && prereqs.length);
      }

  /**
   * Parses all prerequisites of a task (and their prerequisites, etc.)
   * recursively -- depth-first, so prereqs run first
   * @param {String} name The name of the current task whose
   * prerequisites are being parsed.
   * @param {Boolean} [isRoot] Is this the root task of a prerequisite tree or not
   * @param {Boolean} [includePrereqs] Whether or not to descend into prerequs
   */
    , _parsePrereqs = function (name, opts) {
        var task = _this.getTask(name)
          , includePrereqs = opts.includePrereqs || false
          , isRoot = opts.isRoot || false
          , args = opts.args
          , prereqs = task ? task.prereqs : [];

        // No task found -- if it's the root, throw, because we know that
        // *should* be an existing task. Otherwise it could be a file prereq
        if (isRoot && !task) {
          throw new Error('Task "' + name + '" not found.');
        }
        else {
          if (includePrereqs && _taskHasPrereqs(prereqs)) {
            for (var i = 0, ii = prereqs.length; i < ii; i++) {
              _parsePrereqs(prereqs[i], {isRoot: false, includePrereqs: includePrereqs});
            }
          }
          _workingTaskList.push(new Invocation(name, args));
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

  this.createTree = function (name, opts) {
    _parsePrereqs(name, opts);
  };

  /**
   * Initial function called to run the specified task. Parses all the
   * prerequisites and then kicks off the queue-processing
   * @param {String} name The name of the task to run
   * @param {Array} args The list of command-line args passed after
   * the task name -- may be a combination of plain positional args,
   * or name/value pairs in the form of name:value or name=value to
   * be placed in a final keyword/value object param
   */
  this.runTask = function (name, args, includePrereqs) {
    this.createTree(name, {isRoot: true, includePrereqs: includePrereqs, args: args});
    _taskList.splice.apply(_taskList, [_taskIndex, 0].concat(_workingTaskList));
    _workingTaskList = [];
    this.runNextTask();
  };

  this.reenableTask = function (name, includePrereqs) {
    var invocation
      , task;
    _parsePrereqs(name, {isRoot: true, includePrereqs: includePrereqs});
    if (!_workingTaskList.length) {
      fail('No tasks to reenable.');
    }
    else {
      for (var i = 0, ii = _workingTaskList.length; i < ii; i++) {
        invocation = _workingTaskList[i];
        task = this.getTask(invocation.taskName);
        task.done = false;
      }
    }
    _workingTaskList = [];
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
      if(typeof ns === "undefined" || ns === null) {
        fail('Cannot find the namespace "' + currName + '" for task "' + name + '".');
      }
    }

    var task = ns.tasks[taskName];
    return task;
  };

  /**
   * Runs the next task in the _taskList queue until none are left
   * Synchronous tasks require calling "complete" afterward, and async
   * ones are expected to do that themselves
   * TODO Add a cancellable error-throw in a setTimeout to allow
   * an async task to timeout instead of having the script hang
   * indefinitely
   */
  this.runNextTask = function () {
    var invocation = _taskList[_taskIndex]
      , name
      , task
      , args
      , prereqs
      , prereqName
      , prereqTask
      , stats
      , modTime;

    // If there are still tasks to run, do it
    if (invocation) {
      name = invocation.taskName;
      args = invocation.args;

      _taskIndex++;

      task = this.getTask(name);

      // Task, FileTask, DirectoryTask
      if (task) {
      prereqs = task.prereqs;

        // Run tasks only once, even if it ends up in the task queue multiple times
        if (task.done) {
          complete();
        }
        // Okie, we haven't done this one
        else {
          // Flag this one as done, no repeatsies
          task.done = true;

          if (task instanceof FileTask) {
            try {
              stats = fs.statSync(task.name);
              modTime = stats.ctime;
            }
            catch (e) {
              // Assume there's a task to fall back to to generate the file
            }

            // Compare mod-time of all the prereqs with the mod-time of this task
            if (prereqs.length) {
              for (var i = 0, ii = prereqs.length; i < ii; i++) {
                prereqName = prereqs[i];
                prereqTask = this.getTask(prereqName);
                // Run the action if:
                // 1. The prereq is a normal task
                // 2. A file/directory task with a mod-date more recent than
                // the one for this file (or this file doesn't exist yet)
                if ((prereqTask && !(prereqTask instanceof FileTask || prereqTask instanceof DirectoryTask))
                    || (!modTime || _modTimes[prereqName] >= modTime)) {
                  if (typeof task.action == 'function') {
                    task.action.apply(task, args || []);
                    // The action may have created/modified the file
                    // ---------
                    // If there's a valid file at the end of running the task,
                    // use its mod-time as last modified
                    try {
                      stats = fs.statSync(task.name);
                      modTime = stats.ctime;
                    }
                    // If there's still no actual file after running the file-task,
                    // treat this simply as a plain task -- the current time will be
                    // the mod-time for anything that depends on this file-task
                    catch (e) {
                      modTime = new Date();
                    }
                  }
                  break;
                }
              }
            }
            else {
              if (typeof task.action == 'function') {
                task.action.apply(task, args || []);
                modTime = new Date();
              }
            }

            _modTimes[name] = modTime;

            // Async tasks call this themselves
            if (!task.async) {
              complete();
            }

          }
          else {
            // Run this mofo
            if (typeof task.action == 'function') {
              task.action.apply(task, args || []);
            }

            // Async tasks call this themselves
            if (!task.async) {
              complete();
            }
          }
        }
      }
      // Task doesn't exist; assume file. Just get the mod-time if the file
      // actually exists. If it doesn't exist, we're dealing with a missing
      // task -- just blow up
      else {
        stats = fs.statSync(name);
        _modTimes[name] = stats.ctime;
        complete();
      }
    }
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
      , name
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

      name = '\033[32m' + p + '\033[39m ';

      // Create padding-string with calculated length
      padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');

      descr = task.description
      if (descr) {
        descr = '\033[90m # ' + descr + '\033[39m \033[37m \033[39m';
        console.log('jake ' + name + padding + descr);
      }
    }
  };

  this.createTask = function () {
    var args = Array.prototype.slice.call(arguments)
      , task
      , type
      , name
      , action
      , async
      , prereqs = [];

      type = args.shift()

      // name, [deps], [action]
      // Older name (string) + deps (array) format
      if (typeof args[0] == 'string') {
        name = args.shift();
        if (_isArray(args[0])) {
          prereqs = args.shift();
        }
        if (typeof args[0] == 'function') {
          action = args.shift();
          async =  args.shift();
        }
      }
      // name:deps, [action]
      // Newer object-literal syntax, e.g.: {'name': ['depA', 'depB']}
      else {
        obj = args.shift()
        for (var p in obj) {
          prereqs = prereqs.concat(obj[p]);
          name = p;
        }
        action = args.shift();
        async =  args.shift();
      }

    if (type == 'directory') {
      action = function () {
        if (!path.existsSync(name)) {
          fs.mkdirSync(name, 0755);
        }
      };
      task = new DirectoryTask(name, prereqs, action, async, type);
    }
    else if (type == 'file') {
      task = new FileTask(name, prereqs, action, async, type);
    }
    else {
      task = new Task(name, prereqs, action, async, type);
    }

    if (jake.currentTaskDescription) {
      task.description = jake.currentTaskDescription;
      jake.currentTaskDescription = null;
    }
    jake.currentNamespace.tasks[name] = task;
  };

}();

jake.Task = Task;
jake.Namespace = Namespace;

module.exports = jake;
