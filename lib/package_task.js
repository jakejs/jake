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
  this.tarCommand = 'tar';
  this.zipCommand = 'zip';
  if (typeof definition == 'function') {
    definition.call(this);
  }
  this.define();
};

PackageTask.prototype = new (function () {

  var _compressOpts = {
        Tar: {
          ext: '.tgz'
        , flag: 'z'
        }
      , TarGz: {
          ext: '.tar.gz'
        , flag: 'z'
        }
      , TarBz2: {
          ext: '.tar.bz2'
        , flag: 'j'
        }
      };

  this.define = function () {
    var self = this
      , packageDirPath = this.packageDirPath()
      , taskObj = {}
      , compressTaskArr = [];

    desc('Force a rebuild of the package')
    task({'repackage': ['clobberPackage', 'package']});

    task('clobberPackage', function () {
      exec('rm -fr ' + self.packageDir, function (err, stdout, stderr) {
        if (err) { throw err; }
        complete();
      });
    }, true);

    desc('Remove the package')
    task({'clobber': ['clobberPackage']});

    for (var p in _compressOpts) {
      if (this['need' + p]) {
        (function (p) {
          var filename = self.packageDir + '/' + self.packageName() + _compressOpts[p].ext
          ,   taskObj = {};
          compressTaskArr.push(filename);

          taskObj[filename] = [packageDirPath];
          file(taskObj, function () {
            var opts = _compressOpts[p];
            // Move into the package dir to compress
            process.chdir(self.packageDir);
            var cmd = self.tarCommand + ' -' + opts.flag + 'cvf ' +
                self.packageName() + opts.ext + ' ' + self.packageName();
            exec(cmd, function (err, stdout, stderr) {
              if (err) { throw err; }
              // Return back up to the project directory
              process.chdir(currDir);
              complete();
            });
          }, true);
        })(p);
      }
    }

    desc('Build the package for distribution');
    task({'package': compressTaskArr}, function () {});

    directory(this.packageDir);

    taskObj[packageDirPath] = [this.packageDir].concat(self.packageFiles.toArray());
    file(taskObj, function () {
      var fileList = [];
      self.packageFiles.forEach(function (name) {
        var f = path.join(self.packageDirPath(), name)
          , fDir = path.dirname(f)
          , fDirArr = fDir.split('/')
          , baseDir = ''
          , stats;
        fDirArr.forEach(function (dir) {
          baseDir += baseDir ? '/' + dir : dir;
          if (!path.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, 0755);
          }
        });
        stats = fs.statSync(name);
        if (stats.isDirectory()) {
          fs.mkdirSync(f, 0755);
        }
        else {
          fileList.push({
            to: name
          , from: f
          });
        }
      });
      var _copyFile = function () {
        var file = fileList.pop();
        if (file) {
          exec('cp ' + file.to + ' ' + file.from, function (err, stdout, stderr) {
            if (err) { throw err; }
            _copyFile();
          });
        }
        else {
          complete();
        }
      };
      _copyFile();
    }, true);


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

