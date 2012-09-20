/*
 * Utilities: A classic collection of JavaScript utilities
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

/**
  @name file
  @namespace file
*/

var fs = require('fs')
  , path = require('path')
  , JS_PAT = /\.(js|coffee)$/
  , logger;

var logger = new (function () {
  var out;
  try {
    out = require('./logger');
  }
  catch (e) {
    out = console;
  }

  this.log = function (o) {
    out.log(o);
  };
})();

var fileUtils = new (function () {
  var _copyFile
    , _readDir
    , _rmDir
    , _watch;

  // Recursively copy files and directories
  _copyFile = function(fromPath, toPath, opts) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , options = opts || {}
      , fromStat = fs.statSync(from)
      , toStat
      , destExists
      , destDoesNotExistErr
      , content
      , filename
      , dirContents
      , targetDir;

    // Check if the destination path exists then set the path stat
    try {
      toStat = fs.statSync(to);
      destExists = true;
    }
    catch (err) {
      destDoesNotExistErr = err;
      destExists = true;
    }

    // Destination exists so copy into directory or overwrite file
    if (destExists) {
      // If rename option is given use it otherwise
      // use original name
      filename = options.rename || path.basename(from);

      // Copying a directory
      if (fromStat.isDirectory()) {
        dirContents = fs.readdirSync(from);
        targetDir = path.join(to, filename);

        // Overwrite to directory
        try {
          fs.mkdirSync(targetDir, options.mode || 0755)
        }
        catch (err) {
          if (err.code != 'EEXIST') {
            throw err;
          }
        }

        // Copy all files
        for (var i = 0, len = dirContents.length; i < len; i++) {
          _copyFile(path.join(from, dirContents[i]), targetDir);
        }
      }
      // Copying a file
      else {
        content = fs.readFileSync(from);

        // Copying into a directory
        if (toStat.isDirectory()) {
          fs.writeFileSync(path.join(to, filename), content)
        }
        // Overwriting a file
        else {
          fs.writeFileSync(to, content);
        }
      }
    }
    // Destination dosn't exist
    else {
      throw destDoesNotExistErr;
    }
  };

  // Return the contents of a given directory
  _readDir = function (dirPath) {
    var dir = path.normalize(dirPath)
      , paths = []
      , ret = [dir];

    try {
      paths = fs.readdirSync(dir);
    }
    catch (err) {
      throw new Error('Could not read path ' + dir);
    }

    paths.forEach(function (p) {
      var curr = path.join(dir, p)
        , stat = fs.statSync(curr);

      if (stat.isDirectory()) {
        ret = ret.concat(_readDir(curr));
      }
      else {
        ret.push(curr);
      }
    });

    return ret;
  };

  // Remove the given directory
  _rmDir = function (dirPath) {
    var dir = path.normalize(dirPath)
      , paths = fs.readdirSync(dir);

    // Remove each child path
    paths.forEach(function (p) {
      var curr = path.join(dir, p)
        , stat = fs.statSync(curr);

      if (stat.isDirectory()) {
        _rmDir(curr);
      }
      else {
        fs.unlinkSync(curr);
      }
    });

    fs.rmdirSync(dir);
  };

  // Recursively watch js/cs files with a callback
  _watch = function (p, callback) {
    fs.stat(p, function (err, stats) {
      if (err) {
        return false;
      }

      // If file then watch it
      if (stats.isFile() && JS_PAT.test(p)) {
        fs.watchFile(p, callback);
      }
      // If directory then recursively watch all it's children
      else if (stats.isDirectory()) {
        fs.readdir(p, function (err, files) {
          if (err) {
            return log.fatal(err);
          }

          for (var f in files) {
            _watch(path.join(p, files[f]), callback);
          }
        });
      }
    });
  };

  /**
    @name file#cpR
    @public
    @function
    @description Copies a directory/file to a destination
    @param {String} fromPath The source path to copy from
    @param {String} toPath The destination path to copy to
    @param {Object} opts Options to use
      @param {Boolean} [opts.silent] If false then will log the command
  */
  this.cpR = function (fromPath, toPath, opts) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , toStat
      , doesNotExistErr
      , paths
      , filename
      , options = opts || {};

    if (!options.silent) {
      logger.log('cp -r ' + fromPath + ' ' + toPath);
    }
    options = {}; // Reset

    if (from == to) {
      throw new Error('Cannot copy ' + from + ' to itself.');
    }

    // Handle rename-via-copy
    try {
      toStat = fs.statSync(to);
    }
    catch (err) {
      doesNotExistErr = err;

      // Get abs path so it's possible to check parent dir
      if (!this.isAbsolute(to)) {
        to = path.join(process.cwd(), to);
      }

      // Save the file/dir name
      filename = path.basename(to);

      // See if a parent dir exists, so there's a place to put the
      /// renamed file/dir (resets the destination for the copy)
      to = path.dirname(to);

      try {
        toStat = fs.statSync(to);
      }
      catch (err) {}

      if (toStat && toStat.isDirectory()) {
        // Set the rename opt to pass to the copy func, will be used
        // as the new file/dir name
        options.rename = filename;
      }
      else {
        throw doesNotExistErr;
      }
    }

    _copyFile(from, to, opts);
  };

  /**
    @name file#mkdirP
    @public
    @function
    @description Create the given directory(ies) using the given mode permissions
    @param {String} dir The directory to create
    @param {Number} mode The mode to give the created directory(ies)(Default: 0755)
  */
  this.mkdirP = function (dir, mode) {
    var dirPath = path.normalize(dir)
      , paths = dirPath.split(/\/|\\/)
      , currPath
      , next;

    if (paths[0] == '' || /^[A-Za-z]+:/.test(paths[0])) {
      currPath = paths.shift() || '/';
      currPath = path.join(currPath, paths.shift());
    }

    while (paths.length) {
      next = paths.shift();

      if (next == '..') {
        currPath = path.join(currPath, next);
        continue;
      }
      currPath = path.join(currPath, next);

      try {
        fs.mkdirSync(currPath, mode || 0755);
      }
      catch (err) {
        if (err.code != 'EEXIST') {
          throw e;
        }
      }
    }
  };

  /**
    @name file#readdirR
    @public
    @function
    @return {Array} Returns the contents as an Array, can be configured via opts.format
    @description Reads the given directory returning it's contents
    @param {String} dir The directory to read
    @param {Object} opts Options to use
      @param {String} [opts.format] Set the format to return(Default: Array)
  */
  this.readdirR = function (dir, opts) {
    var options = opts || {}
      , format = options.format || 'array'
      , ret = _readDir(dir);

    return format == 'string' ? ret.join('\n') : ret;
  };

  /**
    @name file#rmRf
    @public
    @function
    @description Deletes the given directory/file
    @param {String} p The path to delete, can be a directory or file
    @param {Object} opts Options to use
      @param {String} [opts.silent] If false then logs the command
  */
  this.rmRf = function (p, opts) {
    var stat
      , options = opts || {};

    if (!options.silent) {
      logger.log('rm -rf ' + p);
    }

    try {
      stat = fs.statSync(p);

      if (stat.isDirectory()) {
        _rmDir(p);
      }
      else {
        fs.unlinkSync(p);
      }
    }
    catch (err) {}
  };

  /**
    @name file#isAbsolute
    @public
    @function
    @return {Boolean/String} If it's absolute the first char is returned otherwise false
    @description Checks if a given path is absolute or relative
    @param {String} p Path to check
  */
  this.isAbsolute = function (p) {
    var match = /^[A-Za-z]+:\\|^\//.exec(p);

    if (match && match.length) {
      return match[0];
    }
    return false;
  };

  /**
    @name file#absolutize
    @public
    @function
    @return {String} Returns the absolute path for the given path
    @description Returns the absolute path for the given path
    @param {String} p The path to get the absolute path for
  */
  this.absolutize = function (p) {
    if (this.isAbsolute(p)) {
      return p;
    }
    else {
      return path.join(process.cwd(), p);
    }
  };

  this.basedir = function (p) {
    var str = p || ''
      , abs = this.isAbsolute(p);

    if (abs) {
      return abs;
    }
    // Split into segments
    str = str.split(/\\|\//)[0];

    // If the path has a leading asterisk, basedir is the current dir
    if (str.indexOf('*') > -1) {
      return '.';
    }
    // Otherwise it's the first segment in the path
    else {
      return str;
    }
  };

  /**
    @name file#searchParentPath
    @public
    @function
    @description Search for a directory/file in the current directory and parent directories
    @param {String} p The path to search for
    @param {Function} callback The function to call once the path is found
  */
  this.searchParentPath = function(p, callback) {
    if (!p) {
      // Return if no path is given
      return;
    }
    var cwd = process.cwd()
      , relPath = ''
      , i = 5 // Only search up to 5 directories
      , pathLoc
      , pathExists;

    while (--i >= 0) {
      pathLoc = path.join(cwd, relPath, p);
      pathExists = this.existsSync(pathLoc);

      // If path exists call the callback with the full path
      if (pathExists) {
        callback && callback(undefined, pathLoc);
        break;
      }
      // Path doesn't exist so search the parent
      else {
        // Dir could not be found
        if (i === 0) {
          callback && callback(new Error("Path \"" + pathLoc + "\" not found"), undefined);
          break;
        }

        // Add a relative parent directory
        relPath += '../';
        // Switch to relative parent directory
        process.chdir(path.join(cwd, relPath));
      }
    }
  };

  /**
    @name file#watch
    @public
    @function
    @description Watch a given path then calls the callback once a change occurs
    @param {String} path The path to watch
    @param {Function} callback The function to call when a change occurs
  */
  this.watch = function () {
    _watch.apply(this, arguments);
  };

  // Compatibility for fs.exists(0.8) and path.exists(0.6)
  this.exists = (typeof fs.exists === 'function') ? fs.exists : path.exists;

  // Compatibility for fs.existsSync(0.8) and path.existsSync(0.6)
  this.existsSync = (typeof fs.existsSync === 'function') ? fs.existsSync : path.existsSync;

  /**
    @name file#requireLocal
    @public
    @function
    @return {Object} The given module is returned
    @description Require a local module from the node_modules in the current directory
    @param {String} module The module to require
    @param {String} message An option message to throw if the module doesn't exist
  */
  this.requireLocal = function(module, message) {
    // Try to require in the application directory
    try {
      dep = require(path.join(process.cwd(), 'node_modules', module));
    }
    catch (err) {
      if (message) {
        throw new Error(message);
      }

      throw new Error('Module "' + module + '" could not be found as a ' +
          'local module.\n Please make sure there is a node_modules directory in the ' +
          'current directory,\n and install it by doing "npm install ' +
          module + '"');
    }

    return dep;
  };
})();

module.exports = fileUtils;

