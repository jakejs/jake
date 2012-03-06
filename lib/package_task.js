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

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.PackageTask
  @constructor
  @description Instantiating a PackageTask creates a number of Jake
  Tasks that make packaging and distributing your software easy.

  @param {String} name The name of the project
  @param {String} version The current project version (will be
  appended to the project-name in the package-archive
  @param {Function} definition Defines the contents of the package,
  and format of the package-archive. Will be executed on the instantiated
  PackageTask (i.e., 'this', will be the PackageTask instance),
  to set the various instance-propertiess.

  @example
  var t = new jake.PackageTask('rous', 'v' + version, function () {
    var files = [
      'Capfile'
    , 'Jakefile'
    , 'README.md'
    , 'package.json'
    , 'app/*'
    , 'bin/*'
    , 'config/*'
    , 'lib/*'
    , 'node_modules/*'
    ];
    this.packageFiles.include(files);
    this.packageFiles.exclude('node_modules/foobar');
    this.needTarGz = true;
  });

 */
var PackageTask = function (name, version, definition) {
  /**
    @name jake.PackageTask#name
    @public
    @type {String}
    @description The name of the project
   */
  this.name = name;
  /**
    @name jake.PackageTask#version
    @public
    @type {String}
    @description The project version-string
   */
  this.version = version;
  /**
    @name jake.PackageTask#version
    @public
    @type {String='pkg'}
    @description The directory-name to use for packaging the software
   */
  this.packageDir = 'pkg';
  /**
    @name jake.PackageTask#packageFiles
    @public
    @type {jake.FileList}
    @description The list of files and directories to include in the
    package-archive
   */
  this.packageFiles = new jake.FileList();
  /**
    @name jake.PackageTask#needTar
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a gzip .tgz archive of the pagckage
   */
  this.needTar = false;
  /**
    @name jake.PackageTask#needTar
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a gzip .tar.gz archive of the pagckage
   */
  this.needTarGz = false;
  /**
    @name jake.PackageTask#needTarBz2
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a bzip2 .bz2 archive of the pagckage
   */
  this.needTarBz2 = false;
  /**
    @name jake.PackageTask#needJar
    @public
    @type {Boolean=false}
    @description If set to true, uses the `jar` utility to create
    a .jar archive of the pagckage
   */
  this.needJar = false;
  /**
    @name jake.PackageTask#needZip
    @public
    @type {Boolean=false}
    @description If set to true, uses the `zip` utility to create
    a .zip archive of the pagckage
   */
  this.needZip = false;
  /**
    @name jake.PackageTask#manifestFile
    @public
    @type {String=null}
    @description Can be set to point the `jar` utility at a manifest
    file to use in a .jar archive. If unset, one will be automatically
    created by the `jar` utility. This path should be relative to the
    root of the package directory (this.packageDir above, likely 'pkg')
   */
  this.manifestFile = null;
  /**
    @name jake.PackageTask#tarCommand
    @public
    @type {String='tar'}
    @description The shell-command to use for creating tar archives.
   */
  this.tarCommand = 'tar';
  /**
    @name jake.PackageTask#jarCommand
    @public
    @type {String='jar'}
    @description The shell-command to use for creating jar archives.
   */
  this.jarCommand = 'jar';
  /**
    @name jake.PackageTask#zipCommand
    @public
    @type {String='zip'}
    @description The shell-command to use for creating zip archives.
   */
  this.zipCommand = 'zip';
  /**
    @name jake.PackageTask#archiveChangeDir
    @public
    @type {String=null}
    @description Equivalent to the '-C' command for the `tar` and `jar`
    commands. ("Change to this directory before adding files.")
   */
  this.archiveChangeDir = null;
  /**
    @name jake.PackageTask#archiveContentDir
    @public
    @type {String=null}
    @description Specifies the files and directories to include in the
    package-archive. If unset, this will default to the main package
    directory -- i.e., name + version.
   */
  this.archiveContentDir = null;

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
            if (self.archiveChangeDir) {
              cmd += ' -C ' + self.archiveChangeDir;
            }
            if (self.archiveContentDir) {
              cmd += ' ' + self.archiveContentDir;
            }
            else {
              cmd += ' ' + self.packageName();
            }

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

