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
  , utils = new (function () {

  this.exec = function (arr, callback, opts) {
    var options = opts || {}
      , stdout = options.stdout
      , stderr = options.stderr
      , breakOnError = options.breakOnError
    var run = function (cmd) {
      exec(cmd, function (err, stdout, stderr) {
        var next;
        if (err && breakOnError) {
          this.fail('Error: ' + JSON.stringify(err));
        }
        if (stderr && options.stderr) {
          console.log('Error: ' + stderr);
        }
        if (stdout && options.stdout) {
          console.log(stdout);
        }
        next = arr.shift();
        if (next) {
          run(next);
        }
        else {
          if (callback) {
            callback();
          }
        }
      });
    };
    run(arr.shift());
  };

})();

module.exports = utils;
