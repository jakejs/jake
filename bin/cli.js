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
  , libPath = __dirname + '/../lib'
  , fs = require('fs')
  , jake = require(libPath + '/jake')
  , api = require(libPath + '/api')
  , utils = require(libPath + '/utils')
  , Program = require(libPath + '/program').Program
  , program = new Program()
  , Loader = require(libPath + '/loader').Loader
  , loader = new Loader()
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json').toString())
  , opts
  , envVars
  , taskNames;

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

  // Convenience aliases
  jake.opts = opts;
  for (var p in utils) {
    jake[p] = utils[p];
  }
  jake.FileList = require(libPath + '/file_list').FileList;
  jake.PackageTask = require(libPath + '/package_task').PackageTask;
  jake.NpmPublishTask = require(libPath + '/npm_publish_task').NpmPublishTask;

  // Enhance env with any env vars passed in
  for (var p in envVars) { process.env[p] = envVars[p]; }

  loader.load(opts.jakefile);

  // Set working dir
  var dirname = opts.directory;
  if (dirname) {
    process.chdir(dirname);
  }

  taskNames = program.taskNames;
  taskNames = taskNames.length ? taskNames : ['default'];
  task('__root__', taskNames, function () {});

  if (opts.tasks) {
    jake.showAllTaskDescriptions(opts.tasks);
  }
  else {
    jake.Task['__root__'].invoke();
  }
}

