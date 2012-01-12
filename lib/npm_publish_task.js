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
  , exec = require('child_process').exec
  , currDir = process.cwd();

var NpmPublishTask = function (name, packageFiles) {
  this.name = name;
  this.packageFiles = packageFiles;
  this.define();
};


NpmPublishTask.prototype = new (function () {

  this.define = function () {
    var self = this;

    namespace('npm', function () {
     task('version', function () {
        cmds = [
          'npm version patch --message "Bumped version number."'
        , 'git push origin master'
        , 'git push --tags'
        ];
        jake.exec(cmds, function () {
          console.log('Bumped version number.');
          complete();
        });
      }, {async: true});

      task('definePackage', function () {
        var version = jake.getPackageVersionNumber()
          , t;
        t = new jake.PackageTask(this.name, 'v' + version, function () {
          this.packageFiles.include(self.packageFiles);
          this.needTarGz = true;
        });
      });

      task('package', function () {
        var pack = jake.Task['package'];
        pack.addListener('complete', function () {
          console.log('Created package.');
          complete();
        });
        pack.invoke();
      }, {async: true});

      task('publish', function () {
        var version = jake.getPackageVersionNumber();
        cmds = [
          'sudo npm publish pkg/' + self.name + '-v' + version + '.tar.gz'
        ];
        // Hackity hack -- NPM publish sometimes returns errror like:
        // Error sending version data\nnpm ERR!
        // Error: forbidden 0.2.4 is modified, should match modified time
        setTimeout(function () {
          jake.exec(cmds, function () {
            console.log('Published to NPM.');
            complete();
          }, {stdout: true});
        }, 5000);
      }, {async: true});
    });


    desc('Bump version-number, package, and publish to NPM.');
    task('publish', ['npm:version', 'npm:definePackage', 'npm:package',
        'npm:publish'], function () {});

  };

})();

jake.NpmPublishTask = NpmPublishTask;
exports.NpmPublishTask = NpmPublishTask;

