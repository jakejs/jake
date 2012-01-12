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


var exec = require('child_process').exec
  , fs = require('fs')
  , utils;

utils = new (function () {

  this.exec = function (arr, callback, opts) {
    var options = opts || {}
      , list = arr.slice()
      , stdout = options.stdout
      , stderr = options.stderr
      , breakOnError = typeof options.breakOnError != 'undefined' ?
            options.breakOnError : true
      , run;

    run = function () {
      var next = list.shift();
      if (next) {
        exec(next, function (err, stdout, stderr) {
          if (err && breakOnError) {
            this.fail('Error: ' + JSON.stringify(err));
          }
          if (stderr && options.stderr) {
            console.log('Error: ' + stderr);
          }
          if (stdout && options.stdout) {
            console.log(stdout);
          }
          run();
        });
      }
      else {
        if (callback) {
          callback();
        }
      }
    };

    run();
  };

  this.getPackageVersionNumber = function () {
    pkg = JSON.parse(fs.readFileSync(process.cwd() + '/package.json').toString())
    version = pkg.version
    return version;
  };

})();

module.exports = utils;
