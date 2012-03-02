var fs = require('fs')
  , path = require('path');

var fileUtils = new (function () {
  var _copyFile = function(fromPath, toPath, opts) {
        var from = path.normalize(fromPath)
          , to = path.normalize(toPath)
          , fromStat
          , toStat
          , destExists
          , destDoesNotExistErr
          , content
          , createDir = opts.createDir
          , recurse = opts.recurse;

        if (fromPath == toPath) {
          throw new Error('Cannot copy ' + from + ' to itself.');
        }

        fromStat = fs.statSync(from);

        try {
          toStat = fs.statSync(to);
          destExists = true;
          //console.dir(to + ' destExists');
        }
        catch(e) {
          destDoesNotExistErr = e;
          destExists = false;
          //console.dir(to + ' does not exist');
        }
        // Destination dir or file exists, copy in or overwrite
        if (destExists || createDir) {
          if (createDir) {
            //console.log('creating dir ' + to);
            try {
              fs.mkdirSync(to);
            }
            catch(e) {
              if (e.code != 'EEXIST') {
                throw e;
              }
            }
          }
          // Copying a directory
          if (fromStat.isDirectory()) {
            var dirContents = fs.readdirSync(from)
            , targetDir = path.join(to, path.basename(from));
            // We don't care if the target dir already exists
            try {
              fs.mkdirSync(targetDir);
            }
            catch(e) {
              if (e.code != 'EEXIST') {
                throw e;
              }
            }
            for (var i = 0, ii = dirContents.length; i < ii; i++) {
              //console.log(dirContents[i]);
              _copyFile(path.join(from, dirContents[i]), targetDir,
                  {createDir: true});
            }
          }
          // Copying a file
          else {
            content = fs.readFileSync(from);
            // Copy into dir
            if (toStat.isDirectory()) {
              //console.log('copy into dir ' + to);
              fs.writeFileSync(path.join(to, path.basename(from)), content);
            }
            // Overwrite file
            else {
              console.log('overwriting ' + to);
              fs.writeFileSync(to, content);
            }
          }
        }
        // Dest doesn't exist, can't create it
        else {
          throw destDoesNotExistErr;
        }
      }

    , _copyDir = function (from, to, opts) {
        var createDir = opts.createDir;
      }

    , _readDir = function (dirPath) {
        var dir = path.normalize(dirPath)
          , paths = []
          , ret = [dir];
        paths = fs.readdirSync(dir);
        paths.forEach(function (p) {
          var curr = path.join(dir, p);
          console.log(curr);
          var stat = fs.statSync(curr);
          ret.push(curr);
          if (stat.isDirectory()) {
            ret = ret.concat(_readDir(curr));
          }
        });
        return ret;
      };

  this.cpR = function (from, to) {
    _copyFile.apply(this, [from, to, {recurse: true}]);
  };

  this.mkdirP = function (dir) {
    var dirPath = path.normalize(dir)
      , paths = dirPath.split(/\/|\\/)
      , currPath
      , next;

    if (paths[0] == '' || /[A-Za-z]+:/.test(paths[0])) {
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
        fs.mkdirSync(currPath);
      }
      catch(e) {
        if (e.code != 'EEXIST') {
          throw e;
        }
      }
    }
  };

  this.readdirR = function (dir, opts) {
    var options = opts || {}
      , format = options.format || 'array'
      , ret;
    ret = _readDir(dir);
    return format == 'string' ? ret.join('\n') : ret;
  };
})();

module.exports = fileUtils;

