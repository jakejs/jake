#!/usr/bin/env node
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

let path = require('path');
let localJakeDir = path.join(process.cwd(), 'node_modules', 'jake');

// Try to load a local jake
let usingLocalJake = false;
try {
  require(localJakeDir);
  usingLocalJake = true;
}
// If that fails, likely running globally
catch(e) {
  require('../lib/jake');
}
if (usingLocalJake) {
  warnOnVersionMismatch();
}

// The local jake runs instead of this one, so make a different version loud
function warnOnVersionMismatch() {
  let pc = require('picocolors');
  let thisVersion = require('../package.json').version;
  let localVersion;
  try {
    localVersion = require(path.join(localJakeDir, 'package.json')).version;
  }
  catch(e) {
    return;
  }
  if (localVersion == thisVersion) {
    return;
  }
  let line = '!'.repeat(72);
  console.error(pc.bold(pc.red([
    line,
    `WARNING: Running local jake ${localVersion} from ${localJakeDir}`,
    `instead of jake ${thisVersion} from ${path.resolve(__dirname, '..')}`,
    'Update the jake dependency in package.json to use this version.',
    line
  ].join('\n'))));
}

var args = process.argv.slice(2);

jake.run.apply(jake, args);
