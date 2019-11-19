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

// Files like jakelib/foobar.jake.js
const JAKELIB_FILE_PAT = /\.jake$|\.js$/;
const IMPLICIT_JAKEFILE_NAMES = [
  'Jakefile',
  'Gulpfile'
];

let Loader = function () {
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
    }
  }

  function fileExists(name) {
    // Will later `require`, which handles either with or without .js
    if (existsSync(name) || existsSync(name + '.js')) {
      return true;
    }
  }

  // Recursive
  function findImplicitJakefile() {
    let cwd = process.cwd();
    let names = IMPLICIT_JAKEFILE_NAMES;
    let found = null;
    names.some((name) => {
      let n;
      n = name;
      if (fileExists(n)) {
        found = n;
        return true;
      }
      // Check for all-lowercase as well
      n = name.toLowerCase();
      if (fileExists(n)) {
        found = n;
        return true;
      }
    });
    if (found) {
      return found;
    }
    else {
      process.chdir("..");
      // If we've walked all the way up the directory tree,
      // bail out with no result
      if (cwd === process.cwd()) {
        return null;
      }
      return findImplicitJakefile();
    }
  }

  this.loadFile = function (fileSpecified) {
    let jakefile;
    let origCwd = process.cwd();

    if (fileSpecified) {
      if (existsSync(fileSpecified)) {
        jakefile = fileSpecified;
      }
    }
    else {
      jakefile = findImplicitJakefile();
    }

    if (jakefile) {
      loadFile(utils.file.absolutize(jakefile));
      return true;
    }
    else {
      if (!fileSpecified) {
        // Restore the working directory on failure
        process.chdir(origCwd);
      }
      return false;
    }
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
