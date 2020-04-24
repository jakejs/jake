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

var fs = require('fs')
  , path = require('path')
  , DEFAULT_INCLUDE_PAT = /\.(js|coffee|css|less|scss)$/
  , DEFAULT_EXCLUDE_PAT = /\.git|node_modules/
  , logger;

var logger = new (function () {
  var out;
  try {
    out = require('./log');
  }
  catch (e) {
    out = console;
  }

  this.log = function (o) {
    out.log(o);
  };
})();

/**
  @name file
  @namespace file
*/

var fileUtils = new (function () {
  var _copyFile
    , _rmDir;

  // Recursively copy files and directories
  _copyFile = function (fromPath, toPath, opts) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , options = opts || {}
      , fromStat
      , toStat
      , destExists
      , destDoesNotExistErr
      , content
      , filename
      , dirContents
      , targetDir;

    fromStat = fs.statSync(from);

    try {
      //console.dir(to + ' destExists');
      toStat = fs.statSync(to);
      destExists = true;
    }
    catch(e) {
      //console.dir(to + ' does not exist');
      destDoesNotExistErr = e;
      destExists = false;
    }
    // Destination dir or file exists, copy into (directory)
    // or overwrite (file)
    if (destExists) {

      // If there's a rename-via-copy file/dir name passed, use it.
      // Otherwise use the actual file/dir name
      filename = options.rename || path.basename(from);

      // Copying a directory
      if (fromStat.isDirectory()) {
        dirContents = fs.readdirSync(from);
        targetDir = path.join(to, filename);
        // We don't care if the target dir already exists
        try {
          fs.mkdirSync(targetDir, fromStat.mode & 07777);
        }
        catch(e) {
          if (e.code !== 'EEXIST') {
            throw e;
          }
        }
        for (var i = 0, ii = dirContents.length; i < ii; i++) {
          _copyFile(path.join(from, dirContents[i]), targetDir, {preserveMode: options.preserveMode});
        }
      }
      // Copying a file
      else {
        content = fs.readFileSync(from);
        var mode = fromStat.mode & 07777;
        var targetFile = to;

        if (toStat.isDirectory()) {
          targetFile = path.join(to, filename);
        }

        var fileExists = fs.existsSync(targetFile);
        fs.writeFileSync(targetFile, content);

        // If the file didn't already exist, use the original file mode.
        // Otherwise, only update the mode if preserverMode is true.
        if(!fileExists || options.preserveMode) {
          fs.chmodSync(targetFile, mode);
        }
      }
    }
    // Dest doesn't exist, can't create it
    else {
      throw destDoesNotExistErr;
    }
  };

  // Remove the given directory
  _rmDir = function (dirPath) {
    var dir = path.normalize(dirPath)
      , paths = [];
    paths = fs.readdirSync(dir);
    paths.forEach(function (p) {
      var curr = path.join(dir, p);
      var stat = fs.lstatSync(curr);
      if (stat.isDirectory()) {
        _rmDir(curr);
      }
      else {
        try {
          fs.unlinkSync(curr);
        } catch(e) {
          if (e.code === 'EPERM') {
            fs.chmodSync(curr, parseInt(666, 8));
            fs.unlinkSync(curr);
          } else {
            throw e;
          }
        }
      }
    });
    fs.rmdirSync(dir);
  };

  /**
    @name file#cpR
    @public
    @function
    @description Copies a directory/file to a destination
    @param {String} fromPath The source path to copy from
    @param {String} toPath The destination path to copy to
    @param {Object} opts Options to use
      @param {Boolean} [opts.preserveMode] If target file already exists, this
        determines whether the original file's mode is copied over. The default of
        false mimics the behavior of the `cp` command line tool. (Default: false)
  */
  this.cpR = function (fromPath, toPath, options) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , toStat
      , doesNotExistErr
      , filename
      , opts = options || {};

    if (from == to) {
      throw new Error('Cannot copy ' + from + ' to itself.');
    }

    // Handle rename-via-copy
    try {
      toStat = fs.statSync(to);
    }
    catch(e) {
      doesNotExistErr = e;

      // Get abs path so it's possible to check parent dir
      if (!this.isAbsolute(to)) {
        to = path.join(process.cwd() , to);
      }

      // Save the file/dir name
      filename = path.basename(to);
      // See if a parent dir exists, so there's a place to put the
      /// renamed file/dir (resets the destination for the copy)
      to = path.dirname(to);
      try {
        toStat = fs.statSync(to);
      }
      catch(e) {}
      if (toStat && toStat.isDirectory()) {
        // Set the rename opt to pass to the copy func, will be used
        // as the new file/dir name
        opts.rename = filename;
        //console.log('filename ' + filename);
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
      , currPath = ''
      , next;

    if (paths[0] == '' || /^[A-Za-z]+:/.test(paths[0])) {
      currPath = paths.shift() || '/';
      currPath = path.join(currPath, paths.shift());
      //console.log('basedir');
    }
    while ((next = paths.shift())) {
      if (next == '..') {
        currPath = path.join(currPath, next);
        continue;
      }
      currPath = path.join(currPath, next);
      try {
        //console.log('making ' + currPath);
        fs.mkdirSync(currPath, mode || parseInt(755, 8));
      }
      catch(e) {
        if (e.code != 'EEXIST') {
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
      , ret;
    ret = _readDir(dir);
    return format == 'string' ? ret.join('\n') : ret;
  };

  /**
    @name file#rmRf
    @public
    @function
    @description Deletes the given directory/file
    @param {String} p The path to delete, can be a directory or file
  */
  this.rmRf = function (p, options) {
    var stat
      , opts = options || {};
    try {
      stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        _rmDir(p);
      }
      else {
        fs.unlinkSync(p);
      }
    }
    catch (e) {}
  };

  /**
    @name file#isAbsolute
    @public
    @function
    @return {Boolean/String} If it's absolute the first character is returned otherwise false
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

})();

module.exports = fileUtils;

