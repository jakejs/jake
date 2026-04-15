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


var util = require('util') // Native Node util module
  , exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , EventEmitter = require('events').EventEmitter
  , utils = require('utilities')
  , logger = require('./logger')
  //, tarjan = require('./tarjan')
  , fs = require('fs')
  , Exec;

var parseArgs = function (argumentsObj) {
    var args
      , arg
      , cmds
      , callback
      , opts = {
          interactive: false
        , printStdout: false
        , printStderr: false
        , breakOnError: true
        };

    args = Array.prototype.slice.call(argumentsObj);

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
        utils.mixin(opts, arg);
      }
    }

    // Backward-compat shim
    if (typeof opts.stdout != 'undefined') {
      opts.printStdout = opts.stdout;
      delete opts.stdout;
    }
    if (typeof opts.stderr != 'undefined') {
      opts.printStderr = opts.stderr;
      delete opts.stderr;
    }

    return {
      cmds: cmds
    , opts: opts
    , callback: callback
    };
};

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
    @param {Object} [opts]
      @param {Boolean} [opts.printStdout=false] Print stdout from each command
      @param {Boolean} [opts.printStderr=false] Print stderr from each command
      @param {Boolean} [opts.breakOnError=true] Stop further execution on
      the first error.
      @param {Boolean} [opts.windowsVerbatimArguments=false] Don't translate
      arguments on Windows.
    @param {Function} [callback] Callback to run after executing  the
    commands

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
    jake.exec(cmds, {stdout: true}, callback);
   */
  this.exec = function (a, b, c) {
    var parsed = parseArgs(arguments)
      , cmds = parsed.cmds
      , opts = parsed.opts
      , callback = parsed.callback;

    var ex = new Exec(cmds, opts, callback);

    if (!opts.interactive) {
      if (opts.printStdout) {
        ex.addListener('stdout', function (data) {
          process.stdout.write(data);
        });
      }
      if (opts.printStderr) {
        ex.addListener('stderr', function (data) {
          process.stderr.write(data);
        });
      }
    }
    ex.addListener('error', function (msg, code) {
      if (opts.breakOnError) {
        fail(msg, code);
      }
    });
    ex.run();

    return ex;
  };

  this.createExec = function (a, b, c) {
    return new Exec(a, b, c);
  };

  function reduce_uniq(p, c){
      p[c] = 1;
      return p;
  }
  this.uniq = function(arr){
      if (!arr)
          return [];
      // Order may be lost
      return Object.keys(arr.reduce(reduce_uniq, {}));
  };

})());

Exec = function () {
  var parsed = parseArgs(arguments)
    , cmds = parsed.cmds
    , opts = parsed.opts
    , callback = parsed.callback;

  this._cmds = cmds;
  this._callback = callback;
  this._config = opts;
};

util.inherits(Exec, EventEmitter);

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
          var spawnOpts = {};
          this.emit('cmdStart', next);

          // Ganking part of Node's child_process.exec to get cmdline args parsed
          if (process.platform == 'win32') {
            cmd = 'cmd';
            args = ['/c', next];
            if (config.windowsVerbatimArguments) {
              spawnOpts.windowsVerbatimArguments = true;
            }
          }
          else {
            cmd = '/bin/sh';
            args = ['-c', next];
          }

          if (config.interactive) {
            spawnOpts.stdio = 'inherit';
            sh = spawn(cmd, args, spawnOpts);
          }
          else {
            spawnOpts.stdio = [process.stdin, 'pipe', 'pipe'];
            sh = spawn(cmd, args, spawnOpts);
            // Out
            sh.stdout.on('data', function (data) {
              self.emit('stdout', data);
            });
            // Err
            sh.stderr.on('data', function (data) {
              var d = data.toString();
              self.emit('stderr', data);
              // Accumulate the error-data so we can use it as the
              // stack if the process exits with an error
              errData += d;
            });
          }

          // Exit, handle err or run next
          sh.on('exit', function (code) {
            var msg;
            if (code !== 0) {
              msg = errData || 'Process exited with error.';
              msg = utils.string.trim(msg);
              self.emit('error', msg, code);
            }
            if (code === 0 || !config.breakOnError) {
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
// tarjan.js
function Tarjan(){
    this.index = 0;
    this.stack = [];
    this.scc = [];
}
function Vertex(name){
    this.name = name || null;
    this.connections = [];
    this.index= -1;
    this.lowlink = -1;
}
var TJ = {};
TJ.process = function(tasks, list){
    // convert all tasks to graph
    var cache = {}, vertices = [];
    function to_vertex(task){
        if (!task)
            return;
        var name = task.fullName;
        if (name in cache)
            return cache[name];
        var vertex = cache[name] = new Vertex(name);
        vertices.push(vertex);
        for (var p=0; p<task.prereqs.length; p++) {
            var child = to_vertex(tasks[task.prereqs[p]]);
            if (child)
                vertex.connections.push(child);
        }
        return vertex;
    };
    var tlist = list||Object.keys(tasks);
    for (var t=0, tt=tlist.length; t<tt; t++)
        to_vertex(tasks[tlist[t]]);
    return TJ.run(vertices);
};
TJ.run = function(vertices){
    var T = new Tarjan();
    var S = {cache: {}, stack: []};
    for (var i=0; i<vertices.length; i++) {
        var vertex = vertices[i];
        if (vertex.index<0)
            TJ.strong(T, S, vertices[i]);
    }
    return T;
};
TJ.strong = function(T, S, vertex){
    // Set the depth index for v to the smallest unused index
    vertex.index = T.index;
    vertex.lowlink = T.index;
    T.index = T.index + 1;
    S.stack.push(vertex);
    if (vertex.name in S.cache)
        throw new Error('Duplicated vertex '+vertex.name+' found');
    S.cache[vertex.name] = vertex;

    // Consider successors of v
    // aka... consider each vertex in vertex.connections
    for (var c=0; c<vertex.connections.length; c++){
        var v = vertex, w = vertex.connections[c];
        if (w.index<0){
            // Successor w has not yet been visited; recurse on it
            TJ.strong(T, S, w);
            v.lowlink = Math.min(v.lowlink, w.lowlink);
        } else if (w.name in S.cache){
            // Successor w is in stack S and hence in the current SCC
            v.lowlink = Math.min(v.lowlink, w.index);
        }
    }

    // If v is a root node, pop the stack and generate an SCC
    if (vertex.lowlink==vertex.index){
        // start a new strongly connected component
        var vertices = [];
        var w = null;
        if (T.stack.length>0){
            do {
                w = T.stack.pop();
                delete S.cache[w.name]
                // add w to current strongly connected component
                vertices.push(w);
            } while (vertex.name != w.name);
        }
        // output the current strongly connected components
        // only if 2 or more components strongly connected
        if (vertices.length>1)
            T.scc.push(vertices);
    }
};
utils.tarjan = TJ;
// file.js
var E = {};
var path = require('path');
E.is_win = /^win/.test(process.platform);
E.exists = function(path){
    return fs.existsSync(path); };
E.is_file = function(path){
    var stat;
    try { stat = fs.statSync(path); }
    catch(e){ return false; }
    return stat.isFile();
};
E.is_dir = function(path){
    var stat;
    try { stat = fs.statSync(path); }
    catch(e){ return false; }
    return stat.isDirectory();
};
if (E.is_win)
{
    E.cygwin_root = E.is_dir('C:/cygwin64') ? 'C:/cygwin64' :
        E.is_dir('C:/cygwin') ? 'C:/cygwin' :
	E.is_dir('D:/cygwin') ? 'D:/cygwin' : null;
}
E.cyg2unix = function(path){
    if (!E.is_win)
	return path;
    // /cygdrive/X/yyy --> X:/yyy
    path = path.replace(/^\/cygdrive\/(.)(\/(.*))?$/, "$1:/$3");
    // /xxx --> c:/cygwin/xxx
    path = path.replace(/^\//, E.cygwin_root.toLowerCase()+'/');
    return path;
};
E.unix2win = function(path){
    if (!E.is_win)
	return path;
    // c:/xxx -> C:/xxx
    path = path.replace(/^[a-z]:/, function(s){ return s.toUpperCase(); });
    // C:/xxx/yyy -> C:\xxx\yyy
    path = path.replace(/\//g, '\\');
    return path;
};
E.win2unix = function(path, force)
{
    if (!force && !E.is_win)
        return path;
    // C:\xxx\yyy --> C:/xxx/yyy
    path = path.replace(/\\/g, '/');
    // C:/ --> c:/
    path = path.replace(/^[a-z]:/i, function(s){ return s.toLowerCase(); });
    return path;
};
E.win2cyg = function(path){
    if (!E.is_win)
	return path;
    path = E.win2unix(path);
    var escaped_root = E.cygwin_root.replace(/([\?\\\/\[\]+*])/g, '\\$1');
    path = path.replace(new RegExp("^"+escaped_root+"/?", "i"), '/');
    path = path.replace(/^[a-z]:/i, function(s){
	return "/cygdrive/"+s[0].toLowerCase(); });
    return path;
};
E.is_absolute = function(path){
    return /^(\/|([a-z]:))/i.test(path); };
E.absolutize = function(p, d1, d2){
    if (!p||E.is_absolute(p))
        return p;
    if (d2&&E.exists(d2+'/'+p))
        return d2+'/'+p;
    d1 = d1||process.cwd();
    return d1+'/'+p;
};
E.normalize = function(p){
    return E.cyg2unix(E.win2unix(path.normalize(p))); };
utils.mixin(utils.file, E);

module.exports = utils;

