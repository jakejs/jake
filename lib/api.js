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
var exec = require('child_process').exec;

var api = new (function () {
  /**
    @name task
    @static
    @function
    @description Creates a Jake Task
    `
    @param {String} name The name of the Task
    @param {Array} [prereqs] Prerequisites to be run before this task
    @param {Function} [action] The action to perform for this task
    @param {Object} [opts]
      @param {Boolean} [opts.asyc=false] Perform this task asynchronously.
      If you flag a task with this option, you must call the global
      `complete` method inside the task's action, for execution to proceed
      to the next task.

    @example
    desc('This is the default task.');
    task('default', function (params) {
      console.log('This is the default task.');
    });

    desc('This task has prerequisites.');
    task('hasPrereqs', ['foo', 'bar', 'baz'], function (params) {
      console.log('Ran some prereqs first.');
    });

    desc('This is an asynchronous task.');
    task('asyncTask', function () {
      setTimeout(complete, 1000);
    }, {async: true});
   */
  this.task = function (name, prereqs, action, opts) {
    var args = Array.prototype.slice.call(arguments)
      , type
      , createdTask;
    args.unshift('task');
    createdTask = jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name directory
    @static
    @function
    @description Creates a Jake DirectoryTask. Can be used as a prerequisite
    for FileTasks, or for simply ensuring a directory exists for use with a
    Task's action.
    `
    @param {String} name The name of the DiretoryTask

    @example

    // Creates the package directory for distribution
    directory('pkg');
   */
  this.directory = function (name) {
    var args = Array.prototype.slice.call(arguments)
      , createdTask;
    args.unshift('directory');
    createdTask = jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name file
    @static
    @function
    @description Creates a Jake FileTask.
    `
    @param {String} name The name of the FileTask
    @param {Array} [prereqs] Prerequisites to be run before this task
    @param {Function} [action] The action to create this file, if it doesn't
    exist already.
    @param {Object} [opts]
      @param {Array} [opts.asyc=false] Perform this task asynchronously.
      If you flag a task with this option, you must call the global
      `complete` method inside the task's action, for execution to proceed
      to the next task.

   */
  this.file = function (name, prereqs, action, opts) {
    var args = Array.prototype.slice.call(arguments)
      , createdTask;
    args.unshift('file');
    createdTask = jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name desc
    @static
    @function
    @description Creates a description for a Jake Task (or FileTask,
    DirectoryTask). When invoked, the description that iscreated will
    be associated with whatever Task is created next.
    `
    @param {String} description The description for the Task
   */
  this.desc = function (description) {
    jake.currentTaskDescription = description;
  };

  /**
    @name namespace
    @static
    @function
    @description Creates a namespace which allows logical grouping
    of tasks, and prevents name-collisions with task-names. Namespaces
    can be nested inside of other namespaces.
    `
    @param {String} name The name of the namespace
    @param {Function} scope The enclosing scope for the namespaced tasks

    @example
    namespace('doc', function () {
      task('generate', ['doc:clobber'], function () {
        // Generate some docs
      });

      task('clobber', function () {
        // Clobber the doc directory first
      });
    });
   */
  this.namespace = function (name, scope) {
    var curr = jake.currentNamespace
      , ns = curr.childNamespaces[name] || new jake.Namespace(name, curr);
    curr.childNamespaces[name] = ns;
    jake.currentNamespace = ns;
    scope();
    jake.currentNamespace = curr;
    jake.currentTaskDescription = null;
    return ns;
  };

  /**
    @name complete
    @static
    @function
    @description Complets an asynchronous task, allowing Jake's
    execution to proceed to the next task
    `
    @example
    task('generate', ['doc:clobber'], function () {
      exec('./generate_docs.sh', function (err, stdout, stderr) {
        if (err || stderr) {
          fail(err || stderr);
        }
        else {
          console.log(stdout);
          complete();
        }
      });
    }, {async: true});
   */
  this.complete = function (val) {
    var current = jake._invocationChain.pop();
    if (current) {
      current.complete(val);
    }
  };

  /**
    @name fail
    @static
    @function
    @description Causes Jake execution to abort with an error.
    Allows passing an optional error code, which will be used to
    set the exit-code of exiting process.
    `
    @param {Error|String} err The error to thow when aborting execution.
    If this argument is an Error object, it will simply be thrown. If
    a String, it will be used as the error-message. (If it is a multi-line
    String, the first line will be used as the Error message, and the
    remaining lines will be used as the error-stack.)

    @example
    task('createTests, function () {
      if (!fs.existsSync('./tests')) {
        fail('Test directory does not exist.');
      }
      else {
        // Do some testing stuff ...
      }
    });
   */
  this.fail = function (err, code) {
    var msg
      , errObj;
    if (code) {
      jake.errorCode = code;
    }
    if (err) {
      if (typeof err == 'string') {
        // Use the initial or only line of the error as the error-message
        // If there was a multi-line error, use the rest as the stack
        msg = err.split('/n');
        errObj = new Error(msg.shift());
        if (msg.length) {
          errObj.stack = msg.join('\n');
        }
        throw errObj;
      }
      else if (err instanceof Error) {
        throw err;
      }
      else {
        throw new Error(err.toString());
      }
    }
    else {
      throw new Error();
    }
  };

})();

module.exports = api;
