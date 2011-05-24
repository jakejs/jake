#!/usr/bin/env node
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

var JAKE_VERSION = '0.1.12'
  , args = process.argv.slice(2)
  , fs = require('fs')
  , path = require('path')
  , sys = require('sys')
  , parseopts = require('../lib/parseopts')
  , jake = require('../lib/jake')
  , usage
  , optsReg
  , Parser
  , parsed
  , opts
  , cmds
  , taskArr
  , taskName
  , taskArgs
  , jakefile
  , dirname
  , isCoffee
  , exists
  , tasks;

process.addListener('uncaughtException', function (err) {
  var msg;
  console.error('jake aborted.');
  if (opts.trace && err.stack) {
    console.error(err.stack);
  }
  else {
    if (err.stack) {
      msg = err.stack.split('\n').slice(0, 2).join('\n');
      console.error(msg);
      console.error('(See full trace by running task with --trace)');
    }
    else {
      console.error(err.message);
    }
  }
  process.exit(jake.errorCode || 1);
});

var Namespace = jake.Namespace;

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
    + 'Jake JavaScript build tool\n'
    + '********************************************************************************\n'
    + 'If no flags are given, Jake looks for a Jakefile or Jakefile.js in the current directory.\n'
    + '********************************************************************************\n'
    + '{Usage}: jake [options] target (commands/options ...)\n'
    + '\n'
    + '{Options}:\n'
    + '  -f, --jakefile FILE        Use FILE as the Jakefile\n'
    + '  -C, --directory DIRECTORY  Change to DIRECTORY before running tasks.\n'
    + '  -T, --tasks                Display the tasks, with descriptions, then exit.\n'
    + '  -t, --trace                Enable full backtrace.\n'
    + '  -h, --help                 Outputs help information\n'
    + '  -V, --version              Outputs Jake version\n'
    + '';


jake.Task.prototype = new (function () {
  this.invoke = function () {
    jake.runTask(this.fullName, arguments, true);
  };

  this.execute = function () {
    jake.reenableTask(this.fullName, true);
    jake.runTask(this.fullName, arguments, false);
  };

  this.reenable = function (deep) {
    jake.reenableTask(this.fullName, deep);
  };
})();

var task = function (name, prereqs, handler, async) {
  var args = Array.prototype.slice.call(arguments)
    , type;
  args.unshift('task');
  jake.taskOrFile.apply(global, args);
};

var file = function (name, prereqs, handler, async) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('file');
  jake.taskOrFile.apply(global, args);
};

var desc = function (str) {
  jake.currentTaskDescription = str;
};

var namespace = function (name, nextLevelDown) {
  var curr = jake.currentNamespace
    , ns = new Namespace(name, curr);
  curr.childNamespaces[name] = ns;
  jake.currentNamespace = ns;
  nextLevelDown();
  jake.currentNamespace = curr;
};

var complete = function () {
  jake.runNextTask();
};

var fail = function (err, code) {
  if (code) {
    jake.errorCode = code;
  }
  if (err) {
    if (typeof err == 'string') {
      throw new Error(err);
    }
    else if (err instanceof Error) {
      throw err;
    }
    else {
      throw new Error(err.toString());
    }
  }
  else {
    throw new Error();
  }
};

// Globalize these. Yes, globalize. Yes, use eval. :)
var g, globals = [
  'jake'
, 'task'
, 'file'
, 'desc'
, 'namespace'
, 'complete'
, 'fail'
];
for (var i = 0, ii = globals.length; i < ii; i++) {
  g = globals[i];
  eval('global.' + g + ' = ' + g);
}

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
, { full: 'trace'
  , abbr: 't'
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
//taskName = taskName || 'default';

if (taskName) {
  taskArr = taskName.split('[');
  taskName = taskArr[0];
  // Parse any args
  if (taskArr[1]) {
    taskArgs = taskArr[1].replace(/\]$/, '');
    taskArgs = taskArgs.split(',');
  }
}

// Enhance env with any env vars passed in
var envVars = jake.parseEnvVars(cmds);
for (var p in envVars) { process.env[p] = envVars[p]; }

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
  jakefile = path.join(process.cwd(), jakefile);
  tasks = require(jakefile);
}
catch (e) {
  if (e.stack) {
    console.log(e.stack);
  }
  jake.die('Could not load Jakefile: ' + e);
}

jake.parseAllTasks();

if (opts.tasks) {
  jake.showAllTaskDescriptions(opts.tasks);
}
else {
  jake.args = cmds;
  jake.runTask(taskName || 'default', taskArgs, true);
}


