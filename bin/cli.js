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
  , lib_path = __dirname + '/../lib/'
  , fs = require('fs')
  , sys = require('sys')
  , jake = require(lib_path + 'jake.js')
  , api = require(lib_path + 'api.js')
  , Program = require(lib_path + 'program.js').Program
  , program = new Program()
  , Loader = require(lib_path + 'loader.js').Loader
  , loader = new Loader()
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString())
  , opts
  , envVars;

jake.version = pkg.version;

global.jake = jake;

process.addListener('uncaughtException', function (err) {
  program.handleErr(err);
});

program.parseArgs(args);

if (!program.preemptiveOption()) {
  opts = program.opts
  envVars = program.envVars;

  // Globalize top-level API methods (e.g., `task`, `desc`)
  for (var p in api) {
    global[p] = api[p];
  }

  // Enhance env with any env vars passed in
  for (var p in envVars) { process.env[p] = envVars[p]; }

  loader.load(opts.jakefile);

  // Set working dir
  var dirname = opts.directory;
  if (dirname) {
    process.chdir(dirname);
  }

  jake.parseAllTasks();

  if (opts.tasks) {
    jake.showAllTaskDescriptions(opts.tasks);
  }
  else {
    jake.runTask(program.taskName || 'default', program.taskArgs, true);
  }
}

