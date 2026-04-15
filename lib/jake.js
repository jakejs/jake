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

var EventEmitter = require('events').EventEmitter;
// And so it begins
global.jake = new EventEmitter();
// Do not use : on windows, it will break path tasks
// TODO: move to namespace
jake.nsSep = /^win/.test(process.platform) ? '|' : ':';

var fs = require('fs')
  , path = require('path')
  , chalk = require('chalk')
  , taskNs = require('./task')
  , Task = taskNs.Task
  , FileTask = taskNs.FileTask
  , DirectoryTask = taskNs.DirectoryTask
  , Rule = require('./rule').Rule
  , Namespace = require('./namespace').Namespace
  , api = require('./api')
  , utils = require('./utils')
  , Program = require('./program').Program
  , Loader = require('./loader').Loader
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString());

var MAX_RULE_RECURSION_LEVEL = 16;

var Invocation = function (taskName, args) {
  this.taskName = taskName;
  this.args = args;
};

var task_constructors = {
  'task': Task,
  'file': FileTask,
  'directory': DirectoryTask,
};

// Globalize jake and top-level API methods (e.g., `task`, `desc`)
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
  this.program = new Program();
  this.FileList = require('filelist').FileList;
  this.PackageTask = require('./package_task').PackageTask;
  this.PublishTask = require('./publish_task').PublishTask;
  this.WatchTask = require('./watch_task').WatchTask;
  this.TestTask = require('./test_task').TestTask;
  this.Task = Task;
  this.FileTask = FileTask;
  this.DirectoryTask = DirectoryTask;
  this.Namespace = Namespace;
  this.Rule = Rule;

  this.registerTask = function(task){
      var ns = task.namespace;
      var full = task.name;
      while (ns&&ns.name!='default') {
          full = ns.name + jake.nsSep + full;
          ns = ns.parentNamespace;
      }
      task.fullName = full;
      jake.Task[full] = task;
      if (process.version>='v0.12.')
          task.setMaxListeners(1000);
  };

  /**
   * Displays the list of descriptions avaliable for tasks defined in
   * a Jakefile
   */
  this.showAllTaskDescriptions = function (f) {
    var p
      , maxTaskNameLength = 0
      , task
      , str = ''
      , padding
      , name
      , descr
      , filter = typeof f == 'string' ? f : null;

    for (p in jake.Task) {
      task = jake.Task[p];
      // Record the length of the longest task name -- used for
      // pretty alignment of the task descriptions
      maxTaskNameLength = p.length > maxTaskNameLength ?
        p.length : maxTaskNameLength;
    }
    // Print out each entry with descriptions neatly aligned
    for (p in jake.Task) {
      if (filter && p.indexOf(filter) == -1) {
        continue;
      }
      task = jake.Task[p];

      //name = '\033[32m' + p + '\033[39m ';
      name = chalk.green(p);

      // Create padding-string with calculated length
      padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');

      descr = task.description;
      if (descr) {
        descr = chalk.gray(descr);
        console.log('jake ' + name + padding + descr);
      }
    }
  };

  function is_func(x){ return typeof x==='function'; }
  this.createTask = function (constructor) {
    var args = Array.prototype.slice.call(arguments, 1);

    var name, obj, prereqs = [];
    if (typeof args[0] == 'string') {
      // name, [deps], [action]
      // Name (string) + deps (array) format name = args.shift();
      name = args.shift();
      if (Array.isArray(args[0]) || (is_func(args[0]) &&
          (is_func(args[1])||is_func(args[2]))))
        prereqs = args.shift();
    } else {
      // name:deps, [action]
      // Legacy object-literal syntax, e.g.: {'name': ['depA', 'depB']}
      obj = args.shift();
      for (var p in obj) {
        prereqs.push.apply(prereqs, obj[p]);
        name = p;
      }
    }

    // Optional opts/callback or callback/opts
    var arg, action, opts = {};
    while ((arg = args.shift())) {
      if (is_func(arg))
        action = arg;
      else
        opts = arg;
    }

    var task = jake.currentNamespace.resolveTask(name);
    if (task && !action) {
      // Task already exists and no action, just update prereqs, and return it.
      if (Array.isArray(task._prereqs))
        task._prereqs = utils.uniq(task._prereqs.concat(prereqs));
      return task;
    }

    if (typeof constructor == 'string')
      constructor = task_constructors[constructor];
    if (Array.isArray(prereqs))
        prereqs = utils.uniq(prereqs);
    task = new constructor(name, prereqs, action, opts);
    if (jake.currentTaskDescription) {
      task.description = jake.currentTaskDescription;
      jake.currentTaskDescription = null;
    }

    jake.currentNamespace.tasks[name] = task;
    task.namespace = jake.currentNamespace;
    jake.registerTask(task);

    return task;
  };

  this.attemptRule = function (name, ns, level) {
    var prereqRule
      , prereq;
    if (level > MAX_RULE_RECURSION_LEVEL) {
      return null;
    }
    // Check Rule
    prereqRule = ns.matchRule(name);
    if (prereqRule) {
      prereq = prereqRule.createTask(name, level);
    }
    return prereq || null;
  };

  this.createDummyFileTask = function(name, ns) {
    var task_name, task, ns_path = '';
    var file_path = name.split(jake.nsSep).pop(); // Strip any namespace
    if (ns) {
      ns_path = typeof ns=='string' ? ns : ns.path || '';
      if (ns_path.length)
        ns_path += jake.nsSep;
    }
    task_name = ns_path+file_path;
    task = jake.Task[task_name];

    // If there's not already an existing dummy FileTask for it,
    // create one, but only if file exists
    // XXX replace with always cfile when file task added
    var task_func = global.cfile||jake.FileTask;
    if (!task && fs.existsSync(file_path)) {
      task = new task_func(file_path);
      task.dummy = true;
      task.fullName = task_name;
      jake.Task[task_name] = task;
    }

    return task || null;
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
      var jakefileLoaded = loader.loadFile(opts.jakefile);
      var jakelibdirLoaded = loader.loadDirectory(opts.jakelibdir);

      if(!jakefileLoaded && !jakelibdirLoaded) {
        fail('No Jakefile. Specify a valid path with -f/--jakefile, ' +
            'or place one in the current directory.');
      }

      jake.emit('loaded');
      if (!opts['no-run'])
        program.run();
      else
        jake.emit('complete');
    }
  };

})());

module.exports = jake;
