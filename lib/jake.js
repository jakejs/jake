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

var JAKE_VERSION = '0.1.5'
  , args = process.argv.slice(2)
  , sys = require('sys')
  , fs = require('fs')
  , path = require('path');

var usage = ''
    + 'Node-Jake JavaScript build tool\n'
    + '********************************************************************************\n'
    + 'If no flags are given, Node-Jake looks for a Jakefile.js in the current directory.\n'
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

var parseopts = new function () {
  var optsReg = {
    directory: ['-C', '--directory']
    , jakefile: ['-f', '--file']
    , tasks: ['-T', '--tasks']
    , help: ['-h', '--help']
    , version: ['-V', '--version']
  };

  this.parse = function (args) {
    var cmds = [];
    var opts = {};
    var optsReverseMap = {};
    var optsItem;
    var arg;
    var argName;
    var argItems;

    for (var p in optsReg) {
      optsItem = optsReg[p];
      for (var i = 0; i < optsItem.length; i++) {
        optsReverseMap[optsItem[i]] = p;
      }
    }

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = optsReverseMap[argItems[0]];
        if (argName) {
          // If there's no attached value, value is null
          opts[argName] = argItems[1] || null;
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = optsReverseMap[arg];
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
    
    return {cmds: cmds, opts: opts};
  };

};

var parsed = parseopts.parse(args);
var opts = parsed.opts;
var cmds = parsed.cmds;
var taskName = cmds.shift();
var jakefile;
var dirname = opts.directory || process.cwd();

taskName = taskName || 'default';
jakefile = opts.jakefile ?
    opts.jakefile.replace(/\.js$/, '') : dirname + '/Jakefile';
if (jakefile[0] != '/') {
  jakefile = path.join(dirname, jakefile);
}

var jake = new function () {
  this.currentNamespace = 'default';
  this.currentTaskDescription = null;
  this.namespaceTasks = {
    'default': {}
  };
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
  this.runTask = function (name, args) {
    var jake = this;
    
    var task = this.getTask(name);
    var deps = task.deps;
    if (deps && deps instanceof Array) {
      deps = deps.slice();
      var _complete = global.complete;
      var runDependencies = global.complete = function (){
        if (deps.length == 0) {
          global.complete = _complete;
          _doRunTask();
          if (!task.async) {
            global.complete();
          }
          return;
        }
        
        var async = false;
        do {
          if (!deps.length) {
            return runDependencies();
          }
          
          var depName = deps.shift();
          jake.runTask.call(jake, depName, args);
          async = jake.getTask(depName).async;
        } while (!async && global.complete === runDependencies);
      };
      runDependencies();
    } else {
      _doRunTask();
    }
    
    function _doRunTask () {
      var parsed = jake.parseArgs(args);
      var passArgs = parsed.cmds;
      if (parsed.opts) {
        passArgs = parsed.cmds.concat(parsed.opts);
      }
      task.handler.apply(task, passArgs);
    };
  };

  this.parseArgs = function (args) {
    var cmds = [];
    var opts = {};
    var pat = /:|=/;
    var argItems;
    var hasOpts = false;
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

  this.die = function (str) {
    sys.puts(str);
    process.exit();
  };

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

jake.Task = function (name, deps, handler, async) {
  this.name = name;
  this.deps = deps;
  this.handler = handler;
  this.desription = null;
  this.async = async === true;
};

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

global.complete = function () {};

if (typeof opts.help != 'undefined') {
  jake.die(usage);
}

if (typeof opts.version != 'undefined') {
  jake.die(JAKE_VERSION);
}

try {
  var stats = fs.statSync(jakefile + '.js');
}
catch (e) {
  jake.die('Could not load Jakefile.\nIf no Jakefile specified with -f or --jakefile, jake looks for Jakefile.js in the current directory.');
}

try {
  var tasks = require(jakefile);
}
catch (e) {
  jake.die('Could not load Jakefile.');
}

if (typeof opts.tasks != 'undefined') {
  jake.showAllTaskDescriptions();
}
else {
  process.chdir(dirname);
  jake.runTask(taskName, cmds);
}
