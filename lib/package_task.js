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

var path = require('path')
  , fs = require('fs')
  , exec = require('child_process').exec
  , currDir = process.cwd();

var PackageTask = function (name, version, definition) {
  this.name = name;
  this.version = version;
  this.packageDir = 'pkg';
  this.packageFiles = new jake.FileList();
  this.tag = false;
  this.needTar = false;
  this.needTarGz = false;
  this.needTarBz2 = false;
  this.needJar = false;
  this.needZip = false;
  this.manifestFile = null;
  this.tarCommand = 'tar';
  this.jarCommand = 'jar';
  this.zipCommand = 'zip';
  this.archiveDirectory = null;
  if (typeof definition == 'function') {
    definition.call(this);
  }
  this.define();
};

PackageTask.prototype = new (function () {

  var _compressOpts = {
        Tar: {
          ext: '.tgz'
        , flags: 'cvzf'
        , cmd: 'tar'
        }
      , TarGz: {
          ext: '.tar.gz'
        , flags: 'cvzf'
        , cmd: 'tar'
        }
      , TarBz2: {
          ext: '.tar.bz2'
        , flags: 'cvjf'
        , cmd: 'tar'
        }
      , Jar: {
          ext: '.jar'
        , flags: 'cf'
        , cmd: 'jar'
        }
      , Zip: {
          ext: '.zip'
        , flags: 'r'
        , cmd: 'zip'
        }
      };

  this.define = function () {
    var self = this
      , packageDirPath = this.packageDirPath()
      , compressTaskArr = [];

    desc('Build the package for distribution');
    task('package', ['clobberPackage', 'buildPackage']);
    // Backward-compat alias
    task('repackage', ['package']);

    task('clobberPackage', function () {
      jake.exec(['rm -fr ' + self.packageDir], function () {
        complete();
      });
    }, {async: true});

    desc('Remove the package');
    task('clobber', ['clobberPackage']);

    for (var p in _compressOpts) {
      if (this['need' + p]) {
        (function (p) {
          var filename = self.packageDir + '/' + self.packageName() +
              _compressOpts[p].ext;
          compressTaskArr.push(filename);

          file(filename, [packageDirPath], function () {
            var cmd
              , opts = _compressOpts[p];

            // Move into the package dir to compress (see below, after
            // exec)
            process.chdir(self.packageDir);

            cmd = self[opts.cmd + 'Command'];
            cmd += ' -' + opts.flags;
            if (opts.cmd == 'jar' && self.manifestFile) {
              cmd += 'm';
            }
            cmd += ' ' + self.packageName() + opts.ext;
            if (opts.cmd == 'jar' && self.manifestFile) {
              cmd += ' ' + self.manifestFile;
            }
            if (self.archiveDirectory) {
              cmd += ' -C ' + self.archiveDirectory;
            }
            cmd += ' ' + self.packageName();

            exec(cmd, function (err, stdout, stderr) {
              if (err) { throw err; }

              // Return back up to the project directory (see above,
              // before exec)
              process.chdir(currDir);

              complete();
            });
          }, {async: true});
        })(p);
      }
    }

    task('buildPackage', compressTaskArr, function () {});

    directory(this.packageDir);

    file(packageDirPath,
          [this.packageDir].concat(self.packageFiles.toArray()), function () {
      var fileList = [];
      self.packageFiles.forEach(function (name) {
        var f = path.join(self.packageDirPath(), name)
          , fDir = path.dirname(f)
          , fDirArr = fDir.split('/')
          , baseDir = ''
          , stats;

        // Make any necessary container directories
        fDirArr.forEach(function (dir) {
          baseDir += baseDir ? '/' + dir : dir;
          if (!path.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, 0755);
          }
        });

        // Add both files and directories, will be copied with -R
        fileList.push({
          to: name
        , from: f
        });
      });
      var _copyFile = function () {
        var cmd
          , file = fileList.pop();
        if (file) {
          // Do recursive copy of files and directories
          cmd = 'cp -R ' + file.to + ' ' + file.from;
          exec(cmd, function (err, stdout, stderr) {
            if (err) { throw err; }
            _copyFile();
          });
        }
        else {
          complete();
        }
      };
      _copyFile();
    }, {async: true});


  };

  this.packageName = function () {
    if (this.version) {
      return this.name + '-' + this.version;
    }
    else {
      return this.name;
    }
  };

  this.packageDirPath = function () {
    return this.packageDir + '/' + this.packageName();
  };

})();

jake.PackageTask = PackageTask;
exports.PackageTask = PackageTask;

