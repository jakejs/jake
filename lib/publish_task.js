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

let fs = require('fs');
let path = require('path');
let exec = require('child_process').execSync;
let FileList = require('filelist').FileList;

let PublishTask = function () {
  let args = Array.prototype.slice.call(arguments).filter(function (item) {
    return typeof item != 'undefined';
  });
  let arg;
  let opts = {};
  let definition;
  let prereqs = [];
  let createDef = function (arg) {
    return function () {
      this.packageFiles.include(arg);
    };
  };

  this.name = args.shift();

  // Old API, just name + list of files
  if (args.length == 1 && (Array.isArray(args[0]) || typeof args[0] == 'string')) {
    definition = createDef(args.pop());
  }
  // Current API, name + [prereqs] + [opts] + definition
  else {
    while ((arg = args.pop())) {
      // Definition func
      if (typeof arg == 'function') {
        definition = arg;
      }
      // Prereqs
      else if (Array.isArray(arg) || typeof arg == 'string') {
        prereqs = arg;
      }
      // Opts
      else {
        opts = arg;
      }
    }
  }

  this.prereqs = prereqs;
  this.packageFiles = new FileList();
  this.publishCmd = opts.publishCmd || 'npm publish %filename';
  this.publishMessage = opts.publishMessage || 'BOOM! Published.';
  this.gitCmd = opts.gitCmd || 'git';
  this.versionFiles = opts.versionFiles || ['package.json'];
  this.scheduleDelay = 5000;
  this.packageTask = null;
  // npm requires every tarball entry to be under `package/`
  this.archiveRootDir = 'package';
  this._packageVersion = null;
  // Set when this run has created a version commit and tag that
  // haven't been pushed yet
  this._unpushedVersion = null;

  // Override utility funcs for testing
  this._ensureRepoClean = function (stdout) {
    if (stdout.length) {
      fail(new Error('Git repository is not clean.'));
    }
  };
  this._getCurrentBranch = function (stdout) {
    return String(stdout).trim();
  };

  if (typeof definition == 'function') {
    definition.call(this);
  }
  this.define();
};


PublishTask.prototype = new (function () {

  let _currentBranch = null;
  let invokeTask = function (task, opts) {
    opts = opts || {};

    return new Promise((resolve, reject) => {
      let cleanup = function () {
        task.removeListener('_done', onDone);
        task.removeListener('error', onError);
      };
      let onDone = function () {
        cleanup();
        resolve(task.value);
      };
      let onError = function (err) {
        cleanup();
        reject(err);
      };

      task.once('_done', onDone);
      task.once('error', onError);

      if (opts.reenable) {
        task.reenable(!!opts.deep);
      }

      task[opts.method || 'invoke']();
    });
  };

  let getPackage = function () {
    let pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(),
      '/package.json')).toString());
    return pkg;
  };
  let getPackageVersionNumber = function () {
    return getPackage().version;
  };
  // Inherit stdio so npm can prompt for a one-time password or show
  // its web login URL
  let execInteractive = function (cmd) {
    exec(cmd, {stdio: 'inherit'});
  };
  let printRecoverySteps = function (publishTask) {
    let version = publishTask._unpushedVersion;
    let git = publishTask.gitCmd;
    if (!version) {
      return;
    }
    console.error([
      '',
      'The commit and tag for v' + version + ' were created locally but ' +
        'have not been pushed.',
      'To retry the release, fix the problem and run:',
      '  jake publishExisting',
      '  ' + git + ' push origin ' + _currentBranch,
      '  ' + git + ' push origin v' + version,
      'To abandon this version instead, run:',
      '  ' + git + ' tag -d v' + version,
      '  ' + git + ' reset --hard HEAD~1',
      ''
    ].join('\n'));
  };
  let definePackageTask = function (publishTask, opts) {
    let version = getPackageVersionNumber();
    let force = opts && opts.force;

    if (!force && publishTask.packageTask &&
        publishTask._packageVersion == version) {
      return publishTask.packageTask;
    }

    publishTask._packageVersion = version;
    publishTask.packageTask = new jake.PackageTask(
      publishTask.name,
      'v' + version,
      publishTask.prereqs,
      function () {
        // Replace the PackageTask's FileList with the PublishTask's FileList
        this.packageFiles = publishTask.packageFiles;
        this.needTarGz = true; // Default to tar.gz
        // If any of the need<CompressionFormat> or archive opts are set
        // proxy them to the PackageTask
        for (let p in this) {
          if (p.indexOf('need') === 0 || p.indexOf('archive') === 0) {
            if (typeof publishTask[p] != 'undefined') {
              this[p] = publishTask[p];
            }
          }
        }
      });

    return publishTask.packageTask;
  };

  this.define = function () {
    let self = this;

    namespace('publish', function () {
      task('fetchTags', function () {
        // Make sure local tags are up to date
        exec(self.gitCmd + ' fetch --tags');
        console.log('Fetched remote tags.');
      });

      task('getCurrentBranch', function () {
        // Figure out what branch to push to
        let stdout = exec(self.gitCmd + ' symbolic-ref --short HEAD').toString();
        if (!stdout) {
          throw new Error('No current Git branch found');
        }
        _currentBranch = self._getCurrentBranch(stdout);
        console.log('On branch ' + _currentBranch);
      });

      task('ensureClean', function () {
        // Only bump, push, and tag if the Git repo is clean
        let stdout = exec(self.gitCmd + ' status --porcelain --untracked-files=no').toString();
        // Throw if there's output
        self._ensureRepoClean(stdout);
      });

      task('updateVersionFiles', function () {
        let pkg;
        let version;
        let arr;
        let patch;

        // Grab the current version-string
        pkg = getPackage();
        version = pkg.version;
        // Increment the patch-number for the version
        arr = version.split('.');
        patch = parseInt(arr.pop(), 10) + 1;
        arr.push(patch);
        version = arr.join('.');

        // Update package.json or other files with the new version-info
        self.versionFiles.forEach(function (file) {
          let p = path.join(process.cwd(), file);
          let data = JSON.parse(fs.readFileSync(p).toString());
          data.version = version;
          fs.writeFileSync(p, JSON.stringify(data, true, 2) + '\n');
        });
        // Return the version string so that listeners for the 'complete' event
        // for this task can use it (e.g., to update other files before pushing
        // to Git)
        return version;
      });

      task('commitVersion', ['ensureClean', 'updateVersionFiles'], function () {
        let version = getPackageVersionNumber();
        let message = 'Version ' + version;
        let cmds = [
          self.gitCmd + ' commit -a -m "' + message + '"',
          self.gitCmd + ' tag -a v' + version + ' -m "' + message + '"'
        ];
        cmds.forEach((cmd) => {
          exec(cmd);
        });
        self._unpushedVersion = version;
        console.log('Bumped version number to v' + version + '.');
      });

      task('pushVersion', function () {
        let version = getPackageVersionNumber();
        let cmds = [
          self.gitCmd + ' push origin ' + _currentBranch,
          self.gitCmd + ' push origin v' + version
        ];
        cmds.forEach((cmd) => {
          exec(cmd);
        });
        self._unpushedVersion = null;
        console.log('Pushed v' + version + ' to origin/' + _currentBranch + '.');
      });

      let defineTask = task('definePackage', function () {
        return self.definePackageTask({force: true});
      });
      defineTask._internal = true;

      task('package', function () {
        let version = getPackageVersionNumber();

        return self.createPackage()
          .then(() => {
            console.log('Created package for ' + self.name + ' v' + version);
          })
          .catch((err) => {
            printRecoverySteps(self);
            throw err;
          });
      });

      task('publish', function () {
        return new Promise((resolve, reject) => {
          let version = getPackageVersionNumber();
          let filename;
          let cmd;
          let done = function (err) {
            if (err) {
              printRecoverySteps(self);
              reject(err);
              return;
            }
            console.log(self.publishMessage);
            resolve();
          };

          console.log('Publishing ' + self.name + ' v' + version);

          if (typeof self.createPublishCommand == 'function') {
            cmd = self.createPublishCommand(version);
          }
          else {
            filename = './pkg/' + self.name + '-v' + version + '.tar.gz';
            cmd = self.publishCmd.replace(/%filename/gi, filename);
          }

          if (typeof cmd == 'function') {
            cmd(done);
          }
          else {
            // Hackity hack -- NPM publish sometimes returns errror like:
            // Error sending version data\nnpm ERR!
            // Error: forbidden 0.2.4 is modified, should match modified time
            setTimeout(function () {
              try {
                execInteractive(cmd);
              }
              catch (err) {
                done(err);
                return;
              }
              done();
            }, self.scheduleDelay);
          }
        });
      });

      task('cleanup', function () {
        let clobber = jake.Task.clobber;

        return invokeTask(clobber, {reenable: true, deep: true})
          .then(() => {
            console.log('Cleaned up package');
          });
      });

    });

    let prefixNs = function (item) {
      return 'publish:' + item;
    };

    // Create aliases in the default namespace
    // The version commit and tag are pushed only after the release
    // succeeds, so a failed publish doesn't leave a public tag behind
    desc('Create a new version and release.');
    task('publish', self.prereqs.concat(['fetchTags', 'getCurrentBranch',
      'commitVersion', 'release', 'pushVersion']
      .map(prefixNs)));

    desc('Release the existing version.');
    task('publishExisting', self.prereqs.concat(['release']
      .map(prefixNs)));

    task('version', ['fetchTags', 'getCurrentBranch', 'commitVersion',
      'pushVersion']
      .map(prefixNs));

    task('release', ['package', 'publish', 'cleanup']
      .map(prefixNs));

    // Define proactively so there will be a callable 'package' task
    // which can be used apart from 'publish'.
    self.definePackageTask();
  };

  this.definePackageTask = function (opts) {
    return definePackageTask(this, opts);
  };

  this.createPackage = function () {
    this.definePackageTask({force: true});

    if (!jake.Task.package) {
      return Promise.reject(new Error('Package task is not defined.'));
    }

    return invokeTask(jake.Task.package);
  };

})();

jake.PublishTask = PublishTask;
exports.PublishTask = PublishTask;
