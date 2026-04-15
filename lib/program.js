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

var fs = require('fs')
  , parseargs = require('./parseargs')
  , utils = require('./utils')
  , Program
  , optsReg
  , preempts
  , usage
  , die;

optsReg = [
  { full: 'jakefile'
  , abbr: 'f'
  , preempts: false
  , expectValue: true
  }
, { full: 'quiet'
  , abbr: 'q'
  , preempts: false
  , expectValue: false
  }
, { full: 'directory'
  , abbr: 'C'
  , preempts: false
  , expectValue: true
  }
, { full: 'always-make'
  , abbr: 'B'
  , preempts: false
  , expectValue: false
  }
, { full: 'tasks'
  , abbr: 'T'
  , preempts: true
  }
// Alias ls
, { full: 'tasks'
  , abbr: 'ls'
  , preempts: true
  }
, { full: 'trace'
  , abbr: 't'
  , preempts: false
  , expectValue: false
  }
, { full: 'help'
  , abbr: 'h'
  , preempts: true
  }
, { full: 'version'
  , abbr: 'V'
  , preempts: true
  }
, { full: 'verbose'
  , abbr: 'v'
  , expectValue: true
  }
, { full: 'jakelibdir'
  , abbr: 'J'
  , preempts: false
  , expectValue: true
  }
, { full: 'numjobs'
  , abbr: 'j'
  , expectValue: true
  },
  { full: 'sandbox'
  , expectValue: true
  },
  { full: 'root'
  , expectValue: true
  },
  { full: 'no-run'
  },
];

preempts = {
  version: function () {
    die(jake.version);
  }
, help: function () {
    die(usage);
  }
};

usage = ''
    + 'Jake JavaScript build tool\n'
    + '********************************************************************************\n'
    + 'If no flags are given, Jake looks for a Jakefile or Jakefile.js in the current directory.\n'
    + '********************************************************************************\n'
    + '{Usage}: jake [options ...] [env variables ...] target\n'
    + '\n'
    + '{Options}:\n'
    + '  -f,     --jakefile FILE            Use FILE as the Jakefile.\n'
    + '  -C,     --directory DIRECTORY      Change to DIRECTORY before running tasks.\n'
    + '  -v,     --verbose                  Set output level.\n'
    + '  -q,     --quiet                    Disable any output (same as -v0).\n'
    + '  -B,     --always-make              Unconditionally make all targets.\n'
    + '  -j,     --numjobs                  Number of parallel tasks to use.\n'
    + '  -T/ls,  --tasks                    Display the tasks (matching optional PATTERN)\n'
    + '                                     with descriptions, then exit.\n'
    + '  -J,     --jakelibdir JAKELIBDIR    Auto-import any .jake files in JAKELIBDIR.\n'
    + '                                     (default is \'jakelib\')\n'
    + '  -t,     --trace                    Enable full backtrace.\n'
    + '  -h,     --help                     Display this help message.\n'
    + '  -V,     --version                  Display the Jake version.\n'
    + '';

Program = function () {
  this.opts = {};
  this.taskNames = null;
  this.taskArgs = null;
  this.envVars = null;
};

Program.prototype = new (function () {

  this.exit = function(code){
    if (code)
      jake.logger.warn('Exit initiated, wait running tasks to finish');
    jake.Task.threads.exit(function(){
      process.stdout.write('', function() {
        process.stderr.write('', function() {
          if (code===undefined)
            code = jake.errorCode = jake.errorCode || 1;
           process.exit(code);
        });
      });
    });
  };

  this.handleErr = function (err) {
    if (jake.listeners('error').length) {
      jake.emit('error', err);
      return;
    }

    utils.logger.error('jake aborted.');
    if (this.opts.trace && err.stack) {
      utils.logger.error(err.stack);
    }
    else {
      if (err.stack) {
        var msg = err.stack.split('\n').slice(0, 3).join('\n');
        utils.logger.error(msg);
        utils.logger.error('(See full trace by running task with --trace)');
      }
      else {
        utils.logger.error(err.message);
      }
    }
    this.exit(1);
  };

  this.parseArgs = function (args) {
    var result = (new parseargs.Parser(optsReg)).parse(args);
    this.setOpts(result.opts);
    this.setTaskNames(result.taskNames);
    this.setEnvVars(result.envVars);
  };

  this.setOpts = function (options) {
    var opts = options || {};
    utils.mixin(this.opts, opts);
  };

  this.setTaskNames = function (names) {
    if (names && !Array.isArray(names)) {
      throw new Error('Task names must be an array');
    }
    if (names && names.length) {
      this.taskNames = names.map(utils.file.normalize);
    } else {
      this.taskNames = ['default'];
    }
  };

  this.setEnvVars = function (vars) {
    this.envVars = vars || null;
  };

  this.firstPreemptiveOption = function () {
    var opts = this.opts;
    for (var p in opts) {
      if (preempts[p]) {
        return preempts[p];
      }
    }
    return false;
  };

  this.init = function (configuration) {
    var self = this
      , config = configuration || {};
    if (config.options) {
      this.setOpts(config.options);
    }
    if (config.taskNames) {
      this.setTaskNames(config.taskNames);
    }
    if (config.envVars) {
      this.setEnvVars(config.envVars);
    }
    process.addListener('uncaughtException', function (err) {
      self.handleErr(err);
    });
    if (this.envVars) {
      utils.mixin(process.env, this.envVars);
    }
    // setup sandbox & root dir
    this.root = utils.file.normalize(this.opts.root||process.cwd());
    if (this.opts.sandbox)
        this.sandbox = utils.file.normalize(this.opts.sandbox);
  };

  this.run = function () {
    var rootTask
      , taskNames
      , dirname
      , opts = this.opts;

    // Run with `jake -T`, just show descriptions
    if (opts.tasks) {
      return jake.showAllTaskDescriptions(opts.tasks);
    }

    taskNames = this.taskNames;
    if (!(Array.isArray(taskNames) && taskNames.length)) {
      throw new Error('Please pass jake.runTasks an array of task-names');
    }

    // Set working dir
    dirname = opts.directory;
    if (dirname) {
      if (utils.file.existsSync(dirname) &&
        fs.statSync(dirname).isDirectory()) {
        process.chdir(dirname);
      }
      else {
        throw new Error(dirname + ' is not a valid directory path');
      }
    }

    task('__root__', taskNames, function () {});
    var tarjan = utils.tarjan.process(jake.Task, ['__root__']);
    if (tarjan.scc.length)
        die('Recursive dependencies found: '+JSON.stringify(tarjan.scc), 1);

    rootTask = jake.Task.__root__;
    rootTask.once('complete', function () {
      jake.emit('complete');
    });
    jake.emit('start');
    rootTask.invoke();
  };

})();

die = function (msg, code) {
  console.log(msg);
  Program.exit(code||0);
};

module.exports.Program = Program;
