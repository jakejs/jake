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

const PROJECT_DIR = process.env.PROJECT_DIR;

let assert = require('assert');
let jake = require(`${PROJECT_DIR}/lib/jake`);
let { Task } = require(`${PROJECT_DIR}/lib/task/task`);

suite('task', function () {

  test('waits on the previous task timeout using the previous startTime', function () {
    let previous = new Task('previous', [], function () {});
    let current = new Task('current', [], function () {});
    let originalSetTimeout = global.setTimeout;
    let originalFail = jake.fail;
    let originalTaskTimeout = jake._taskTimeout;
    let scheduled = false;

    previous.taskStatus = Task.runStatuses.STARTED;
    previous.startTime = Date.now();
    current._invocationChain = [previous];
    current.namespace = jake.defaultNamespace;

    global.setTimeout = function () {
      scheduled = true;
      return 1;
    };
    jake.fail = function (msg) {
      throw new Error(msg);
    };
    jake._taskTimeout = 1000;

    try {
      assert.doesNotThrow(function () {
        current.run();
      });
      assert.equal(scheduled, true);
    }
    finally {
      global.setTimeout = originalSetTimeout;
      jake.fail = originalFail;
      jake._taskTimeout = originalTaskTimeout;
    }
  });

});
