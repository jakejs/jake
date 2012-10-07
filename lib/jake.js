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
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , path = require('path')
  , taskNs = require('./task')
  , Task = taskNs.Task
  , FileTask = taskNs.FileTask
  , DirectoryTask = taskNs.DirectoryTask
  , api = require('./api')
  , utils = require('./utils')
  , Program = require('./program').Program
  , Loader = require('./loader').Loader
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString());

var Namespace = function (name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.childNamespaces = {};
  this.tasks = {};

  this.resolve = function(relativeName) {
    var parts = relativeName.split(':')
      , name  = parts.pop()
      , ns    = this
      , task;
    for(var i = 0, l = parts.length; ns && i < l; i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return (ns && ns.tasks[name]) ||
      (this.parentNamespace && this.parentNamespace.resolve(relativeName));
  }

};

var Invocation = function (taskName, args) {
  this.taskName = taskName;
  this.args = args;
};

// And so it begins
jake = new EventEmitter();

// Globalize jake and top-level API methods (e.g., `task`, `desc`)
global.jake = jake;
utils.mixin(global, api);

// Copy utils onto base jake
utils.mixin(jake, utils);
// File utils should be aliased directly on base jake as well
utils.mixin(jake, utils.file);

utils.mixin(jake, new (function () {

  this._invocationChain = [];

  // Private variables
  // =================
  // Local reference for scopage
  var self = this;

  // Public properties
  // =================
  this.version = pkg.version;
  // Used when Jake exits with a specific error-code
  this.errorCode = undefined;
  // Loads Jakefiles/jakelibdirs
  this.loader = new Loader();
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
  this.program = new Program()
  this.FileList = require('./file_list').FileList;
  this.PackageTask = require('./package_task').PackageTask;
  this.NpmPublishTask = require('./npm_publish_task').NpmPublishTask;
  this.TestTask = require('./test_task').TestTask;
  this.Task = Task;
  this.FileTask = FileTask;
  this.DirectoryTask = DirectoryTask;
  this.Namespace = Namespace;

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
      , arg
      , task
      , type
      , name
      , action
      , opts = {}
      , prereqs = [];

      type = args.shift()

    // name, [deps], [action]
    // Name (string) + deps (array) format
    if (typeof args[0] == 'string') {
      name = args.shift();
      if (Array.isArray(args[0])) {
        prereqs = args.shift();
      }
    }
    // name:deps, [action]
    // Legacy object-literal syntax, e.g.: {'name': ['depA', 'depB']}
    else {
      obj = args.shift()
      for (var p in obj) {
        prereqs = prereqs.concat(obj[p]);
        name = p;
      }
    }

    // Optional opts/callback or callback/opts
    while ((arg = args.shift())) {
      if (typeof arg == 'function') {
        action = arg;
      }
      else {
        opts = arg;
      }
    }

    task = jake.currentNamespace.resolve(name);
    if (task && !action) {
      // Task already exists and no action, just update prereqs, and return it.
      task.prereqs = task.prereqs.concat(prereqs);
      return task;
    }

    switch (type) {
      case 'directory':
        action = function () {
          jake.mkdirP(name);
        };
        task = new DirectoryTask(name, prereqs, action, opts);
        break;
      case 'file':
        task = new FileTask(name, prereqs, action, opts);
        break;
      default:
        task = new Task(name, prereqs, action, opts);
    }

    if (jake.currentTaskDescription) {
      task.description = jake.currentTaskDescription;
      jake.currentTaskDescription = null;
    }
    jake.currentNamespace.tasks[name] = task;
    task.namespace = jake.currentNamespace;

    // FIXME: Should only need to add a new entry for the current
    // task-definition, not reparse the entire structure
    jake.parseAllTasks();

    return task;
  };

  this.init = function () {
    var self = this;
    process.addListener('uncaughtException', function (err) {
      self.program.handleErr(err);
    });

  };

  this.run = function () {
    var args = Array.prototype.slice.call(arguments)
      , program = this.program
      , loader = this.loader
      , preempt
      , opts;

    program.parseArgs(args);
    program.init();

    preempt = program.firstPreemptiveOption();
    if (preempt) {
      preempt();
    }
    else {
      opts = program.opts;
      // Load Jakefile and jakelibdir files
      loader.loadFile(opts.jakefile);
      loader.loadDirectory(opts.jakelibdir);

      program.run();
    }
  };

})());

module.exports = jake;
