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

var TestTask = function (directory) {

  this.directory = directory;

  namespace('test', function () {


    task('run', function () {
      var jsFiles = jake.readdirR(directory).filter(function (f) {
            return /\.js$/.test(f);
          });
      namespace('testExec', function () {
        var prereqs = []
          , next = function () {
              complete();
            }
          , createAction = function (a) {
              return a(next);
            };

        jsFiles.forEach(function (file) {
          var exp = require(path.join(currDir, file))
            , name
            , action;
          for (var p in exp) {
            name = p;
            action = exp[p];
            prereqs.push(name);
            task(name, createAction(action), {
              async: !!action.length
            });
          }
        });

        task('__top__', prereqs);
        jake.Task['testExec:__top__'].invoke();
      });
    });
  });




};

jake.TestTask = TestTask;
exports.TestTask = TestTask;

