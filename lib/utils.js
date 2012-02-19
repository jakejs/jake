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
  , utils;

utils = new (function () {
  var _mix = function (targ, src, merge, includeProto) {
        for (var p in src) {
          // Don't copy stuff from the prototype
          if (src.hasOwnProperty(p) || includeProto) {
            if (merge &&
                // Assumes the source property is an Object you can
                // actually recurse down into
                (typeof src[p] == 'object') &&
                (src[p] !== null) &&
                !(src[p] instanceof Array)) {
              // Create the source property if it doesn't exist
              // TODO: What if it's something weird like a String or Number?
              if (typeof targ[p] == 'undefined') {
                targ[p] = {};
              }
              _mix(targ[p], src[p], merge, includeProto); // Recurse
            }
            // If it's not a merge-copy, just set and forget
            else {
              targ[p] = src[p];
            }
          }
        }
      }

    , _trim = function (s) {
        var str = s || '';
        return str.replace(/^\s*|\s*$/g, '');
      }

    , _truncate = function (s) {
        var str = s ? s.replace(/\n$/, '') : '';
        return str;
      };


  this.exec = function (arr, callback, opts) {
    var options = opts || {}
      , list = arr.slice()
      , stdout = options.stdout
      , stderr = options.stderr
      , breakOnError = typeof options.breakOnError != 'undefined' ?
            options.breakOnError : true
      , run;

    run = function () {
      var sh
        , cmd
        , args
        , next = list.shift()
        , errData = '';
      // Keep running as long as there are commands in the array
      if (next) {
        // Ganking part of Node's child_process.exec to get cmdline args parsed
        if (process.platform == 'win32') {
          cmd = 'cmd.exe';
          args = ['/s', '/c', next];
        }
        else {
          cmd = '/bin/sh';
          args = ['-c', next];
        }

        // Spawn a child-process, set up output
        sh = spawn(cmd, args);
        // Out
        if (stdout) {
          sh.stdout.on('data', function (data) {
            console.log(_truncate(data.toString()));
          });
        }
        // Err
        sh.stderr.on('data', function (data) {
          var d = data.toString();
          if (stderr) {
            console.error(_truncate(d));
          }
          // Accumulate the error-data so we can use it as the
          // stack if the process exits with an error
          errData += d;
        });
        // Exit, handle err or run next
        sh.on('exit', function (code) {
          var msg = errData || 'Process exited with error.';
          msg = _trim(msg);
          if (breakOnError && code != 0) {
            fail(msg, code);
          }
          else {
            run();
          }
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

  this.objectToString = function (object) {
    var objectArray = [];
    for (var key in object) {
      if ('object' == typeof object[key]) {
        objectArray.push(this.objectToString(object[key]));
      } else {
        objectArray.push(key + '=' + object[key]);
      }
    }
    return objectArray.join(', ');
  };

  /*
   * Mix in the properties on an object to another object
   * yam.mixin(target, source, [source,] [source, etc.] [merge-flag]);
   * 'merge' recurses, to merge object sub-properties together instead
   * of just overwriting with the source object.
   */
  this.mixin = (function () {
    return function () {
      var args = Array.prototype.slice.apply(arguments),
          merge = false,
          targ, sources;
      if (args.length > 2) {
        if (typeof args[args.length - 1] == 'boolean') {
          merge = args.pop();
        }
      }
      targ = args.shift();
      sources = args;
      for (var i = 0, ii = sources.length; i < ii; i++) {
        _mix(targ, sources[i], merge);
      }
      return targ;
    };
  }).call(this);

  this.enhance = (function () {
    return function () {
      var args = Array.prototype.slice.apply(arguments),
          merge = false,
          targ, sources;
      if (args.length > 2) {
        if (typeof args[args.length - 1] == 'boolean') {
          merge = args.pop();
        }
      }
      targ = args.shift();
      sources = args;
      for (var i = 0, ii = sources.length; i < ii; i++) {
        _mix(targ, sources[i], merge, true);
      }
      return targ;
    };
  }).call(this);

})();

module.exports = utils;
