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

const PROJECT_DIR = process.env.PROJECT_DIR;

let fs = require('fs');
let exec = require('child_process').execSync;
let { publishTask, rmRf, mkdirP } = require(`${PROJECT_DIR}/lib/jake`);

fs.writeFileSync('package.json', '{"version": "0.0.1"}');
mkdirP('tmp_publish');
fs.writeFileSync('tmp_publish/foo.txt', 'FOO');

let pub = publishTask('zerb', function () {
  this.packageFiles.include([
    'package.json'
    , 'tmp_publish/**'
  ]);
  if (process.env.ZERB_FAIL) {
    this.publishCmd = 'node -e "process.exit(1)"';
  }
  else {
    this.publishCmd = 'node -p -e "\'%filename\'"';
  }
  this.gitCmd = 'echo';
  this.scheduleDelay = 0;

  this._ensureRepoClean = function () {};
  this._getCurrentBranch = function () {
    return 'v0.0';
  };
});

let packagePath = './pkg/zerb-v0.0.1.tar.gz';

jake.setTaskTimeout(5000);

let cleanupFixture = function () {
  rmRf('pkg', {silent: true});
  rmRf('tmp_publish', {silent: true});
  rmRf('package.json', {silent: true});
};

jake.Task['publish'].on('complete', cleanupFixture);
if (process.env.ZERB_FAIL) {
  process.on('exit', cleanupFixture);
}

task('cleanupUsesDoneEvent', function () {
  let cleanup = jake.Task['publish:cleanup'];
  let clobber = jake.Task.clobber;

  clobber.invoke = function () {
    this.taskStatus = jake.Task.runStatuses.DONE;
    this.emit('_done');
  };

  return new Promise((resolve, reject) => {
    cleanup.once('error', reject);
    cleanup.once('_done', resolve);
    cleanup.invoke();
  });
});

task('packageAsPrereq', ['publish:package'], function () {
  console.log(fs.existsSync(packagePath));
  rmRf('pkg', {silent: true});
  rmRf('tmp_publish', {silent: true});
  rmRf('package.json', {silent: true});
});

task('listPackage', ['publish:package'], function () {
  let out = exec('tar -tzvf ' + packagePath).toString();
  console.log(out.trim());
  rmRf('pkg', {silent: true});
  rmRf('tmp_publish', {silent: true});
  rmRf('package.json', {silent: true});
});

task('createPackagePromise', function () {
  return pub.createPackage()
    .then(function () {
      console.log(fs.existsSync(packagePath));
      rmRf('pkg', {silent: true});
      rmRf('tmp_publish', {silent: true});
      rmRf('package.json', {silent: true});
    });
});
