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

var JAKE_VERSION = '0.1.6'
  , jake
  , args = process.argv.slice(2)
  , fs = require('fs')
  , path = require('path')
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
          opts[argName] = argItems[1] || null;
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
              null : args.shift();
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
    , _taskList = []
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
   * Parses all dependencies of a task (and their dependencies, etc.)
   * recursively, and adds them to the _taskList queue.
   * @param {String} name The name of the current task whose
   * dependencies are being parsed.
   */
  , _parseDeps = function (name) {
    _taskList.push(name);
    var task = _this.getTask(name)
      , deps = task.deps;
    if (deps && _isArray(deps) && deps.length) {
      for (var i = 0, ii = deps.length; i < ii; i++) {
        _parseDeps(deps[i]);
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
    _parseDeps(name);
    if (!_taskList.length) {
      this.die('No tasks to run.');
    }
    // Kick off running the list of tasks
    this.runNextTask(args);
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
    if (!task) {
      throw new Error('Task "' + name + '" is not defined in the Jakefile.');
    }
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
    var name = _taskList.shift()
      , task
      , parsed
      , passArgs;
    // If there are still tasks to run, do it
    if (name) {
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
    console.log(str);
    process.exit();
  };

  /**
   * Displays the list of descriptions avaliable for tasks defined in
   * a Jakefile
   */
  this.showAllTaskDescriptions = function () {
    var nsTasks = this.namespaceTasks;
    var str = '';
    var task;
    for (var p in nsTasks) {
      for (var q in nsTasks[p]) {
        task = nsTasks[p][q];
        if (p != 'default') {
          str += p + ':';
        }
        str += q + ' -- ';
        if (task.description) {
          str += task.description;
        }
        else {
          str += '(No description)';
        }
        str += '\n';
      }
    }
    this.die(str);
  };

}();

/**
 * @constructor
 * A Jake task
 */
jake.Task = function (name, deps, handler, async) {
  this.name = name;
  this.deps = deps;
  this.handler = handler;
  this.desription = null;
  this.async = async === true;
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

taskName = taskName || 'default';

jakefile = opts.jakefile ?
    opts.jakefile.replace(/\.js$/, '').replace(/\.coffee$/, '') : dirname + '/Jakefile';
if (jakefile[0] != '/') {
  jakefile = path.join(dirname, jakefile);
}

if (typeof opts.help != 'undefined') {
  jake.die(usage);
}

if (typeof opts.version != 'undefined') {
  jake.die(JAKE_VERSION);
}

isCoffee = path.existsSync(jakefile + '.coffee');
exists = path.existsSync(jakefile) || path.existsSync(jakefile + '.js') || isCoffee;

if(!exists) {
  jake.die('Could not load Jakefile.\nIf no Jakefile specified with -f or --jakefile, ' +
      'jake looks for Jakefile or Jakefile.js in the current directory.');
}

try {
  if (isCoffee) {
    try {
      CoffeeScript = require('coffee-script');
    } 
    catch (e) {
      jake.die('CoffeeScript is missing! Try `npm install coffee-script`');
    }
  }
  tasks = require(jakefile);
}
catch (e) {
  if (e.stack) {
    console.log(e.stack);
  }
  jake.die('Could not load Jakefile: ' + e);
}

if (typeof opts.tasks != 'undefined') {
  jake.showAllTaskDescriptions();
}
else {
  process.chdir(dirname);
  jake.runTask(taskName, cmds);
}

