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
let fs = require('fs');
let path = require('path');
let jake = require(`${PROJECT_DIR}/lib/jake`);
let { FileTask } = require(`${PROJECT_DIR}/lib/task/file_task`);
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

  test('marks a skipped root invocation chain as done', function () {
    let originalInvocationChain = jake._invocationChain;
    let tmpFile = path.join(PROJECT_DIR, 'test', 'unit', 'tmp-skipped-file-task.txt');
    let task = new FileTask(tmpFile, [], function () {});

    fs.writeFileSync(tmpFile, 'exists');

    task.namespace = jake.defaultNamespace;
    task._invocationChain = [];
    task._invocationChainRoot = true;
    jake._invocationChain = [task];

    try {
      task.run();
      assert.equal(jake._invocationChain.includes(task), false);
      assert.equal(task._invocationChain.chainStatus, Task.runStatuses.DONE);
    }
    finally {
      jake._invocationChain = originalInvocationChain;
      fs.rmSync(tmpFile, {force: true});
    }
  });

});
