#!/usr/bin/env node
/*
 * Node-Jake JavaScript build tool
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

var JAKE_VERSION = '0.1.9'
  , jake
  , args = process.argv.slice(2)
  , fs = require('fs')
  , path = require('path')
  , sys = require('sys')
  , usage
  , parseopts = {}
  , optsReg
  , Parser
  , parsed
  , opts
  , cmds
  , taskName
  , jakefile
  , dirname
  , isCoffee
  , exists
  , tasks;

exists = function () {
  var cwd = process.cwd();
  if (path.existsSync(jakefile) || path.existsSync(jakefile + '.js') ||
    path.existsSync(jakefile + '.coffee')) {
    return true;
  }
  process.chdir("..");
  if (cwd === process.cwd()) {
    return false;
  }
  return exists();
};

usage = ''
    + 'Node-Jake JavaScript build tool\n'
    + '********************************************************************************\n'
    + 'If no flags are given, Node-Jake looks for a Jakefile or Jakefile.js in the current directory.\n'
    + '********************************************************************************\n'
    + '{Usage}: jake [options] target (commands/options ...)\n'
    + '\n'
    + '{Options}:\n'
    + '  -f, --jakefile FILE        Use FILE as the Jakefile\n'
    + '  -C, --directory DIRECTORY  Change to DIRECTORY before running tasks.\n'
    + '  -T, --tasks                Display the tasks, with descriptions, then exit.\n'
    + '  -h, --help                 Outputs help information\n'
    + '  -V, --version              Outputs Node-Jake version\n'
    + '';

/**
 * @constructor
 * Parses a list of command-line args into a key/value object of
 * options and an array of positional commands.
 * @ param {Array} opts A list of options in the following format:
 * [{full: 'foo', abbr: 'f'}, {full: 'bar', abbr: 'b'}]]
 */
parseopts.Parser = function (opts) {
  // Positional commands parse out of the args
  this.cmds = [];
  // A key/value object of matching options parsed out of the args
  this.opts = {};

  // Data structures used for parsing
  this.reg = [];
  this.shortOpts = {};
  this.longOpts = {};

  var item;
  for (var i = 0, ii = opts.length; i < ii; i++) {
    item = opts[i];
    this.shortOpts[item.abbr] = item.full;
    this.longOpts[item.full] = item.full;
  }
  this.reg = opts;
};

parseopts.Parser.prototype = new function () {

  /**
   * Parses an array of arguments into options and positional commands
   * Any matcthing opts end up in a key/value object keyed by the 'full'
   * name of the option. Any args that aren't passed as options end up in
   * an array of positional commands.
   * Any options passed without a value end up with a value of null
   * in the key/value object of options
   * If the user passes options that are not defined in the list passed
   * to the constructor, the parser throws an error 'Unknown option.'
   * @param {Array} args The command-line args to parse
   */
  this.parse = function (args) {
    var cmds = []
      , opts = {}
      , arg
      , argName
      , argItems;

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = this.longOpts[argItems[0].substr(2)];
        if (argName) {
          // If there's no attached value, value is null
          opts[argName] = argItems[1] || true;
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = this.shortOpts[arg.substr(1)];
        if (argName) {
          // If there is no following item, or the next item is
          // another opt, value is null
          opts[argName] = (!args[0] || (args[0].indexOf('-') == 0)) ?
              true : args.shift();
        }
        else {
          throw new Error('Unknown option "' + arg + '"');
        }
      }
      else {
        cmds.push(arg);
      }
    }

    this.cmds = cmds;
    this.opts = opts;
  };

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
  // The list of tasks/dependencies to run, parsed recursively
  // and run bottom-up, so dependencies run first
    , _taskList = []
  // A dictionary of loaded tasks, to ensure that all tasks
  // run once and only once
   , _taskDict = {}
  // The args passed to the 'jake' invocation, after the task name
    , _args;

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
    
  /**
   * Tells us if the task has any dependencies
   * @param {Array.<String>} deps An array of dependencies
   * @return {Boolean} true if deps is a non-empty Array
   */
    , _taskHasDeps = function (deps) {
        return !!(deps && _isArray(deps) && deps.length);
      }

  /**
   * Handles a file task
   * @param {Error} err Error, if any, returned from fs.lstat
   * @param {fs.Stats} stats Stats obj, if any, returned from fs.lstat
   * @param {String} name The task name
   * @param {Array} deps The array of dependencies, if any
   * @callback {Function} Callback for running the task
   */
    , _handleFileTask = function (err, stats, name, deps, callback) {
        // If the task has dependencies these are invoked in order.
        // If any of them were changed after the current file, or
        // if the current file does not exist, then push the current
        // task to the list of tasks and update the time of last change.
        if (_taskHasDeps(deps)) {
          stats = stats || {ctime: 0};
          for (var i = 0, ii = deps.length, depsLeft = deps.length, maxTime = stats.ctime;
              i < ii; i++) {
            _parseDeps(deps[i], false, function (ctime) {
              depsLeft -= 1;
              maxTime = (maxTime == null || maxTime < ctime) ? ctime : maxTime;
              if (depsLeft == 0) {
                if (maxTime > stats.ctime) {
                  _taskList.push(name);
                }
                callback(maxTime);
              }
            });
          }
        }
        // If it does not have dependencies and could not
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
        // No dependencies and the file already existed, then don't
        // do anything and just return the time of last changed.
        else {
          callback(stats.ctime);
        }
      } 

  /**
   * Parses all dependencies of a task (and their dependencies, etc.)
   * recursively -- depth-first, so deps run first
   * @param {String} name The name of the current task whose
   * dependencies are being parsed.
   * @param {Boolean} root Is this the root task of a dependency tree or not
   * @param {Function} [callback] Callbacks for async tasks
   */
    , _parseDeps = function (name, root, callback) {
        var task = _this.getTask(name),
            deps = task ? task.deps : [];

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
              _handleFileTask(err, stats, name, deps, callback);
            });
          }
          // Normal task
          else {
            // If the task has dependencies, execute those first and then
            // push the task to the task list. In case it will be used as a
            // dependancy for a file task, the last time of change is set to
            // the current time in order to force files to update as well.
            if (_taskHasDeps(deps)) {
              for (var i = 0, ii = deps.length, ctr = deps.length; i < ii; i++) {
                _parseDeps(deps[i], false, function () {
                  ctr -= 1;
                  if (ctr == 0) {
                    _taskList.push(name);
                    callback(new Date());
                  }
                });
              }
            }
            // If the task does not have dependencies, just push it.
            else {
              _taskList.push(name);
              callback(new Date());
            }
          }
        }
      };

  // Public properties
  // =================
  // For namespaced tasks -- tasks with no namespace are put into the
  // 'default' namespace so lookup code can work the same for both
  // namespaced and non-namespaced.
  this.currentNamespace = 'default';
  // Saves the description created by a 'desc' call that prefaces a
  // 'task' call that defines a task.
  this.currentTaskDescription = null;
  // Name/value map of all the various tasks defined in a Jakefile.
  // Non-namespaced tasks are placed into 'default.'
  this.namespaceTasks = {
    'default': {}
  };

  /**
   * Initial function called to run the specified task. Parses all the
   * dependencies and then kick off the queue-processing
   * @param {String} name The name of the task to run
   * @param {Array} args The list of command-line args passed after
   * the task name -- may be a combination of plain positional args,
   * or name/value pairs in the form of name:value or name=value to
   * be placed in a final keyword/value object param
   */
  this.runTask = function (name, args) {
    // Save the args as an inner-scope var to keep feeding to each
    // task as it gets executed
    _args = args;
    // Parse all the dependencies up front. This allows use of a simple
    // queue to run all the tasks in order, and treat sync/async essentially
    // the same.
    _parseDeps(name, true, function() {
      if (!_taskList.length) {
        _this.die('No tasks to run.');
      }
      // Kick off running the list of tasks
      _this.runNextTask(args);
    });
  };

  /**
   * Looks up a function object based on its name or namespace:name
   * @param {String} name The name of the task to look up
   */
  this.getTask = function (name) {
    var nameArr = name.split(':');
    var nsName, taskName;
    if (nameArr.length > 1) {
      nsName = nameArr[0];
      taskName = nameArr[1];
    }
    else {
      nsName = 'default';
      taskName = name;
    }

    var task = jake.namespaceTasks[nsName][taskName];
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
  this.runNextTask = function () {
    var name = _taskList.shift()
      , task
      , parsed
      , passArgs;
    // If there are still tasks to run, do it
    if (name) {
      // Run tasks only once, even if it ends up in the task queue
      // multiple times
      if (_taskDict[name]) {
        complete();
      }
      // Okie, we haven't done this one
      else {
        // Flag this one as done, no repeatsies
        _taskDict[name] = true;

        task = this.getTask(name);

        // TODO Do this once instead of on each iteration
        parsed = this.parseArgs(_args);
        passArgs = parsed.cmds;
        if (parsed.opts) {
          passArgs = parsed.cmds.concat(parsed.opts);
        }

        // Run this mofo
        task.handler.apply(task, passArgs);

        // Async tasks call this themselves
        if (!task.async) {
          complete();
        }
      }
    }
  };

  /**
   * Parse the list of args into positional args and a final keyword/value
   * object to pass to the task invocations.
   * @param {Array} args A list of arguments to parse.
   */
  this.parseArgs = function (args) {
    var cmds = []
      , opts = {}
      , pat = /:|=/
      , argItems
      , hasOpts = false;

    for (var i = 0; i < args.length; i++) {
      argItems = args[i].split(pat);
      if (argItems.length > 1) {
        hasOpts = true;
        opts[argItems[0]] = argItems[1];
      }
      else {
        cmds.push(args[i]);
      }
    }
    if (!hasOpts) { opts = null; }
    return {cmds: cmds, opts: opts};
  };

  /**
   * Prints out a message and ends the jake program.
   * @param {String} str The message to print out before dying.
   */
  this.die = function (str) {
	var len = str.length, i;
	for (i = 0; i < len; i+=25) {
		sys.print(str.slice(i,i+25));
	}
    process.exit();
  };

  /**
   * Displays the list of descriptions avaliable for tasks defined in
   * a Jakefile
   */
  this.showAllTaskDescriptions = function () {
    var nsTasks = this.namespaceTasks
      , task
      , flattenedTaskMap = {}
      , maxTaskNameLength = 0
      , descr
      , str = ''
      , padding;
    // Iterate through the namespaces, including the default
    for (var p in nsTasks) {
      // Iterate through the tasks in each namespace
      for (var q in nsTasks[p]) {
        task = nsTasks[p][q];
        // Preface only the namespaced tasks
        q = p == 'default' ? q : p + ':' + q;
        // Record the length of the longest task name -- used for
        // pretty alignment of the task descriptions
        maxTaskNameLength = q.length > maxTaskNameLength ?
          q.length : maxTaskNameLength;
        descr = task.description || '(No description)';
        // Comment-colors FTW
        descr = "\033[90m # "+ descr +"\033[39m";
        // Save with 'taskname' or 'namespace:taskname' key
        flattenedTaskMap[q] = descr;
      }
    }
    // Print out each entry with descriptions neatly aligned
    for (var p in flattenedTaskMap) {
      // Create padding-string with calculated length
      padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');
      console.log('jake ' + p + padding + flattenedTaskMap[p]);
    }
    process.exit();
  };

}();

/**
 * @constructor
 * A Jake task
 */
jake.Task = function (name, deps, handler, async, isFile) {
  this.name = name;
  this.deps = deps;
  this.handler = handler;
  this.desription = null;
  this.async = async === true;
  this.isFile = isFile;
};


// Global functions for being called inside the Jakefile
// Yes, globals are ugly, but adding four globals keeps
// the API nice and simple
global.task = function (name, deps, handler, async) {
  var task = new jake.Task(name, deps, handler, async);
  if (jake.currentTaskDescription) {
    task.description = jake.currentTaskDescription;
    jake.currentTaskDescription = null;
  }
  jake.namespaceTasks[jake.currentNamespace][name] = task;
};

global.file = function (name, deps, handler, async) {
  var task = new jake.Task(name, deps, handler, async, true);
  if (jake.currentTaskDescription) {
    task.description = jake.currentTaskDescription;
    jake.currentTaskDescription = null;
  }
  jake.namespaceTasks[jake.currentNamespace][name] = task;
};

global.desc = function (str) {
  jake.currentTaskDescription = str;
};

global.namespace = function (name, tasks) {
  if (typeof jake.namespaceTasks[name] == 'undefined') {
    jake.namespaceTasks[name] = {};
  }
  jake.currentNamespace = name;
  tasks();
  jake.currentNamespace = 'default';
};

global.complete = function () {
  jake.runNextTask();
};

// ========================
// Run Jake
// ========================
optsReg = [
  { full: 'directory'
  , abbr: 'C'
  }
, { full: 'jakefile'
  , abbr: 'f'
  }
, { full: 'tasks'
  , abbr: 'T'
  }
, { full: 'help'
  , abbr: 'h'
  }
, { full: 'version'
  , abbr: 'V'
  }
];

Parser = new parseopts.Parser(optsReg);
parsed = Parser.parse(args);
opts = Parser.opts;
cmds = Parser.cmds;
taskName = cmds.shift();
dirname = opts.directory || process.cwd();
process.chdir(dirname);
taskName = taskName || 'default';

jakefile = opts.jakefile ?
    opts.jakefile.replace(/\.js$/, '').replace(/\.coffee$/, '') : 'Jakefile';

if (opts.help) {
  jake.die(usage);
}

if (opts.version) {
  jake.die(JAKE_VERSION);
}


if (!exists()) {
  jake.die('Could not load Jakefile.\nIf no Jakefile specified with -f or --jakefile, ' +
      'jake looks for Jakefile or Jakefile.js in the current directory ' +
      'or one of the parent directories.');
}

isCoffee = path.existsSync(jakefile + '.coffee');

try {
  if (isCoffee) {
    try {
      CoffeeScript = require('coffee-script');
    }
    catch (e) {
      jake.die('CoffeeScript is missing! Try `npm install coffee-script`');
    }
  }
  tasks = require(path.join(process.cwd(), jakefile));
}
catch (e) {
  if (e.stack) {
    console.log(e.stack);
  }
  jake.die('Could not load Jakefile: ' + e);
}

if (opts.tasks) {
  jake.showAllTaskDescriptions();
}
else {
  jake.runTask(taskName, cmds);
}

