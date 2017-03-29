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

// Load `jake` global
var fs = require('fs')
  , path = require('path')
  , existsSync = (typeof fs.existsSync === 'function') ? fs.existsSync : path.existsSync;

// if local jake module found - require it instead
for (var currentPath = process.cwd();
     currentPath.length > 0;
     currentPath = currentPath.slice(0, currentPath.lastIndexOf(path.sep)))
{
  var jakeModule = path.join(currentPath, 'node_modules', 'jake');
  if (existsSync(jakeModule)) {
    require(jakeModule);
    break;
  }
}

// if no local jake module, load the global one
if (typeof jake === 'undefined') {
  require('../lib/jake');
}

var args = process.argv.slice(2);

jake.run.apply(jake, args);
