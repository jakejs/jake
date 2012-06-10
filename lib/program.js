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

var parseargs = require('../lib/parseargs')
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
  // Alias lowercase v
, { full: 'version'
  , abbr: 'v'
  , preempts: true
  }
, { full: 'jakelibdir'
  , abbr: 'J'
  , preempts: false
  , expectValue: true
  }
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
    + '  -f,   --jakefile FILE            Use FILE as the Jakefile.\n'
    + '  -C,   --directory DIRECTORY      Change to DIRECTORY before running tasks.\n'
    + '  -q,   --quiet                    Do not log messages to standard output.\n'
    + '  -B,   --always-make              Unconditionally make all targets.\n'
    + '  -T,   --tasks                    Display the tasks (matching optional PATTERN) with descriptions, then exit.\n'
    + '  -J,   --jakelibdir JAKELIBDIR    Auto-import any .jake files in JAKELIBDIR. (default is \'jakelib\')\n'
    + '  -t,   --trace                    Enable full backtrace.\n'
    + '  -h,   --help                     Display this help message.\n'
    + '  -V/v, --version                  Display the Jake version.\n'
    + '';

Program = function () {
  this.opts = {};
  this.taskNames = null;
  this.taskArgs = null;
  this.envVars = null;
};

Program.prototype = new (function () {

  this.handleErr = function (err) {
    var msg;
    jake.logger.error('jake aborted.');
    if (this.opts.trace && err.stack) {
      jake.logger.error(err.stack);
    }
    else {
      if (err.stack) {
        msg = err.stack.split('\n').slice(0, 2).join('\n');
        jake.logger.error(msg);
        jake.logger.error('(See full trace by running task with --trace)');
      }
      else {
        jake.logger.error(err.message);
      }
    }
    process.exit(jake.errorCode || 1);
  };

  this.parseArgs = function (args) {
    var result = (new parseargs.Parser(optsReg)).parse(args);
    this.opts = result.opts;
    this.taskNames = result.taskNames;
    this.envVars = result.envVars;
  };

  this.preemptiveOption = function () {
    var opts = this.opts;
    for (var p in opts) {
      if (preempts[p]) {
        preempts[p]();
        return true;
      }
    }
    return false;
  };

})();

die = function (msg) {
  console.log(msg);
  process.exit();
};

module.exports.Program = Program;
