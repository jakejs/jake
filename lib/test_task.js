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

var TestTask = function (projectName, directory, namespaceName) {
  var ns = namespaceName || 'test';

  desc('Run the tests for ' + projectName);
  task(ns, [ns + ':run']);

  namespace(ns, function () {

    task('run', function () {
      // Grab all the JS files in the specified directory
      var jsFiles = jake.readdirR(directory).filter(function (f) {
            return (/\.js$/).test(f);
          });

      // Create a namespace for all the testing tasks to live in
      namespace(ns + 'Exec', function () {
        // Each test will be a prereq for the dummy top-level task
        var prereqs = []
        // Continuation to pass to the async tests, wrapping `continune`
          , next = function () {
              complete();
            }
        // Used as the action for the defined task for each test.
          , createAction = function (n, a) {
              // A wrapped function that passes in the `next` function
              // for any tasks that run asynchronously
              return function () {
                jake.logger.log('Running ' + n);
                // 'this' will be the task when action is run
                return a.call(this, next);
              };
            };

        // Pull in each test-file, and iterate over any exported
        // test-functions. Register each test-function as a prereq
        // task
        jsFiles.forEach(function (file) {
          var exp = require(path.join(currDir, file))
            , name
            , action
            , isAsync;

          for (var p in exp) {
            name = p;
            action = exp[p];
            // If the test-function is defined with a continuation
            // param, flag the task as async
            isAsync = !!action.length;
            // Add the name of this test to the list of prereqs
            // for the dummy top-level task
            prereqs.push(name);
            // Define the actual task with the name, the wrapped action,
            // and the correc async-flag
            task(name, createAction(name, action), {
              async: isAsync
            });
          }
        });

        // Create the dummy top-level task. When calling a task internally
        // with `invoke` that is async (or has async prereqs), have to listen
        // for the 'complete' event to know when it's done
        task('__top__', prereqs);
        var t = jake.Task[ns + 'Exec:__top__'];
        t.addListener('complete', function () {
          jake.logger.log('All tests ran successfully');
          complete();
        });
        t.invoke(); // Do the thing!
      });
    }, {async: true});
  });


};

jake.TestTask = TestTask;
exports.TestTask = TestTask;

