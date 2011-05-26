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

var args = process.argv.slice(2)
  , fs = require('fs')
  , path = require('path')
  , sys = require('sys')
  , jake = require('../lib/jake')
  , api = require('../lib/api')
  , Program = require('../lib/program.js').Program
  , program = new Program()
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString())
  , opts;

jake.version = pkg.version;

global.jake = jake;

process.addListener('uncaughtException', function (err) {
  program.handleErr(err);
});

program.parseArgs(args);

if (!program.preemptiveOption()) {
  var opts = program.opts
    , taskName = program.taskName
    , taskArgs = program.taskArgs
    , envVars = program.envVars;

  // Globalize top-level API methods (e.g., `task`, `desc`)
  for (var p in api) {
    global[p] = api[p];
  }

  // Enhance env with any env vars passed in
  for (var p in envVars) { process.env[p] = envVars[p]; }

  var dirname = opts.directory || process.cwd();
  process.chdir(dirname);

}

(function () {
  var jakefile = opts.jakefile ?
          opts.jakefile.replace(/\.js$/, '').replace(/\.coffee$/, '') : 'Jakefile'
    , isCoffee = false
    , exists = function () {
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

  if (!exists()) {
    fail('No Jakefile. Specify one with -f/--jakefile, or place one in the current directory.');
  }

  isCoffee = path.existsSync(jakefile + '.coffee');
  try {
    if (isCoffee) {
      try {
        CoffeeScript = require('coffee-script');
      }
      catch (e) {
        program.die('CoffeeScript is missing! Try `npm install coffee-script`');
      }
    }
    jakefile = path.join(process.cwd(), jakefile);
    require(jakefile);
  }
  catch (e) {
    if (e.stack) {
      console.error(e.stack);
    }
    program.die('Could not load Jakefile: ' + e);
  }
})();

jake.parseAllTasks();

if (opts.tasks) {
  jake.showAllTaskDescriptions(opts.tasks);
}
else {
  jake.runTask(taskName || 'default', taskArgs, true);
}


