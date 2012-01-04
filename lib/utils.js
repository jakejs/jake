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
  , spawn = require('child_process').spawn
  , utils = new (function () {

  this.exec = function (arr, callback, opts) {
    var options = opts || {}
      , list = arr.slice()
      , stdout = options.stdout
      , stderr = options.stderr
      , breakOnError = typeof options.breakOnError != 'undefined' ?
            options.breakOnError : true
      , cmd
      , run;

    run = function () {
      var next = list.shift()
        , nextArr;
      if (next) {
        nextArr = next.split(' ');
        next = nextArr.shift();
        cmd = spawn(next, nextArr);
        if (stdout) {
          cmd.stdout.addListener('data', function (d) {
            console.log(d.toString());
          });
        }
        if (stderr) {
          cmd.stderr.addListener('data', function (d) {
            console.log(d.toString());
          });
        }
        cmd.addListener('exit', function (code) {
          if (code != 0 && breakOnError) {
            fail('Shell command "' + next + '" failed with error code ' +
                code, code);
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

})();

module.exports = utils;
