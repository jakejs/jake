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
  , list = require('file_list')
  , exec = require('child_process').exec;

var PackageTask = function (name, version, definition) {
  this.name = name;
  this.version = version;
  this.packageDir = 'pkg';
  this.packageFiles = new jake.FileList();
  this.tag = false;
  this.needTar = false;
  this.needTarGz = false;
  this.needTarBz2 = false;
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
      , taskObj = {};
    // Stub tasks
    desc('Build all the packages');
    task('package');

    desc('Force a rebuild of the package files')
    task({'repackage': ['clobberPackage', 'package']});

    desc('Remove package products')
    task('clobberPackage', function () {
      console.log('running');
      exec('rm -fr ' + self.packageDir, function (err, stdout, stderr) {
      });
    }, true);

    task({'clobber': ['clobberPackage']});

    for (var p in _compressOpts) {
      if (this['need' + p]) {
        //console.log('creating ' + p);
        (function (p) {
          var filename = self.packageDir + '/' + self.packageName() + _compressOpts[p].ext
          ,   taskObj = {};
          task({'package': [filename]}, function () {
          });
          taskObj[filename] = [packageDirPath];
          file(taskObj, function () {
            exec('touch ' + filename, function (err, stdout, stderr) {
              complete();
            });
          }, true);
        })(p);
      }
    }

    directory(this.packageDir);

    taskObj[packageDirPath] = [this.packageDir].concat(self.packageFiles.toArray());
    file(taskObj, function () {
      exec('mkdir -p ' + self.packageDir, function (err, stdout, stderr) {
        complete();
      });
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
module.exports.PackageTask = PackageTask;

