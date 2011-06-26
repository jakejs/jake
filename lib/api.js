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

var api = new (function () {
  this.task = function (name, prereqs, action, async) {
    var args = Array.prototype.slice.call(arguments)
      , type;
    args.unshift('task');
    jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
  };

  this.directory = function (name) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('directory');
    jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
  };

  this.file = function (name, prereqs, action, async) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('file');
    jake.createTask.apply(global, args);
    jake.currentTaskDescription = null;
  };

  this.desc = function (str) {
    jake.currentTaskDescription = str;
  };

  this.namespace = function (name, nextLevelDown) {
    var curr = jake.currentNamespace
      , ns = new jake.Namespace(name, curr);
    curr.childNamespaces[name] = ns;
    jake.currentNamespace = ns;
    nextLevelDown();
    jake.currentNamespace = curr;
    jake.currentTaskDescription = null;
  };

  this.complete = function () {
    jake.runNextTask();
  };

  this.fail = function (err, code) {
    if (code) {
      jake.errorCode = code;
    }
    if (err) {
      if (typeof err == 'string') {
        throw new Error(err);
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
