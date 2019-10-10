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

let path = require('path');
let fs = require('fs');
let existsSync = fs.existsSync;
let utils = require('utilities');

let Loader = function () {
  // Files like jakelib/foobar.jake.js
  let JAKELIB_FILE_PAT = /\.jake(\.js)?$/;

  // Load a Jakefile, running the code inside -- this may result in
  // tasks getting defined using the old Jake API, e.g.,
  // `task('foo' ['bar', 'baz']);`, or can also auto-create tasks
  // from any functions exported from the file
  function loadFile(filePath) {
    let exported = require(filePath);
    for (let [key, value] of Object.entries(exported)) {
      let t;
      if (typeof value == 'function') {
        t = jake.task(key, value);
        t.description = '(Exported function)';
      }
      else if (value instanceof jake.Task) {
        t = jake.task(key, {async: true}, function () {
          value.invoke();
          return new Promise((resolve) => {
            value.on('complete', resolve);
          });
        });
        t.description = '(Exported series function)';
      }
    }
  }

  this.loadFile = function (file) {
    let jakefile = file ?
            file.replace(/\.js$/, '') : 'Jakefile';
    let fileSpecified = !!file;
    let origCwd = process.cwd();

    // Recursive
    let exists = function () {
      let cwd = process.cwd();
      if (existsSync(jakefile) || existsSync(jakefile + '.js')) {
        return true;
      }
      if (!fileSpecified) {
        process.chdir("..");
        if (cwd === process.cwd()) {
          // Restore the working directory on failure
          process.chdir(origCwd);
          return false;
        }
        return exists();
      }
    };

    if (!exists()) {
      return false;
    }

    loadFile(utils.file.absolutize(jakefile));
    return true;
  };

  this.loadDirectory = function (d) {
    let dirname = d || 'jakelib';
    let dirlist;
    dirname = utils.file.absolutize(dirname);
    if (existsSync(dirname)) {
      dirlist = fs.readdirSync(dirname);
      dirlist.forEach(function (filePath) {
        if (JAKELIB_FILE_PAT.test(filePath)) {
          loadFile(path.join(dirname, filePath));
        }
      });
      return true;
    }

    return false;
  };
};

module.exports.Loader = Loader;
