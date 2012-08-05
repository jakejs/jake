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
  , EventEmitter = require('events').EventEmitter
  , utils = require('utilities')
  , logger = require('./logger')
  , Exec;

/**
  @name jake
  @namespace jake
*/
utils.mixin(utils, new (function () {
  /**
    @name jake.exec
    @static
    @function
    @description Executes shell-commands asynchronously with an optional
    final callback.
    `
    @param {String[]} cmds The list of shell-commands to execute
    @param {Function} [callback] Callback to run after executing  the
    commands
    @param {Object} [opts]
      @param {Boolean} [opts.stdout=false] Print stdout from each command
      @param {Boolean} [opts.stderr=false] Print stderr from each command
      @param {Boolean} [opts.breakOnError=true] Stop further execution on
      the first error.

    @example
    var cmds = [
          'echo "showing directories"'
        , 'ls -al | grep ^d'
        , 'echo "moving up a directory"'
        , 'cd ../'
        ]
      , callback = function () {
          console.log('Finished running commands.');
        }
    jake.exec(cmds, callback, {stdout: true});
   */
  this.exec = function (a, b, c) {
    var ex = new Exec(a, b, c);
    ex.addListener('error', function (msg, code) {
      if (ex._config.breakOnError) {
        fail(msg, code);
      }
    });
    ex.run();
  };

  this.createExec = function (a, b, c) {
    return new Exec(a, b, c);
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

})());

Exec = function () {
  var args
    , arg
    , cmds
    , callback
    , opts = {};

  args = Array.prototype.slice.call(arguments);

  cmds = args.shift();
  // Arrayize if passed a single string command
  if (typeof cmds == 'string') {
    cmds = [cmds];
  }
  // Make a copy if it's an actual list
  else {
    cmds = cmds.slice();
  }

  // Get optional callback or opts
  while((arg = args.shift())) {
    if (typeof arg == 'function') {
      callback = arg;
    }
    else if (typeof arg == 'object') {
      opts = arg;
    }
  }

  // Backward-compat shim
  if (typeof opts.stdout != 'undefined') {
    opts.printStdout = opts.stdout;
  }
  if (typeof opts.stderr != 'undefined') {
    opts.printStderr = opts.stderr;
  }

  this._cmds = cmds;
  this._callback = callback;
  this._config = {
    printStdout: false
  , printStderr: false
  , breakOnError: true
  };
  utils.mixin(this._config, opts);
};
Exec.prototype = new EventEmitter();
Exec.prototype.constructor = Exec;

utils.mixin(Exec.prototype, new (function () {

  var _run = function () {
        var self = this
          , sh
          , cmd
          , args
          , next = this._cmds.shift()
          , config = this._config
          , errData = '';

        // Keep running as long as there are commands in the array
        if (next) {
          this.emit('cmdStart', next);

          // Ganking part of Node's child_process.exec to get cmdline args parsed
          cmd = '/bin/sh';
          args = ['-c', next];
          if (process.platform == 'win32') {
            cmd = 'cmd';
            args = ['/c', next];
          }

          // Spawn a child-process, set up output
          sh = spawn(cmd, args);
          // Out
          sh.stdout.on('data', function (data) {
            if (config.printStdout) {
              console.log(utils.string.rtrim(data.toString()));
            }
            self.emit('stdout', data);
          });
          // Err
          sh.stderr.on('data', function (data) {
            var d = data.toString();
            if (config.printStderr) {
              console.error(utils.string.rtrim(d));
            }
            self.emit('stderr', data);
            // Accumulate the error-data so we can use it as the
            // stack if the process exits with an error
            errData += d;
          });
          // Exit, handle err or run next
          sh.on('exit', function (code) {
            var msg;
            if (code != 0) {
              msg = errData || 'Process exited with error.';
              msg = utils.string.trim(msg);
              self.emit('error', msg, code);
            }
            if (code == 0 || !config.breakOnError) {
              self.emit('cmdEnd', next);
              _run.call(self);
            }
          });
        }
        else {
          self.emit('end');
          if (typeof self._callback == 'function') {
            self._callback();
          }
        }
      };

  this.append = function (cmd) {
    this._cmds.push(cmd);
  };

  this.run = function () {
    _run.call(this);
  };

})());

utils.Exec = Exec;
utils.logger = logger;

module.exports = utils;

