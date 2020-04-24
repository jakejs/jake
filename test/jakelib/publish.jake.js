let fs = require('fs');
let { publishTask, rmRf, mkdirP } = require('../../lib/jake');

fs.writeFileSync('package.json', '{"version": "0.0.1"}');
mkdirP('tmp_publish');
fs.writeFileSync('tmp_publish/foo.txt', 'FOO');

publishTask('zerb', function () {
  this.packageFiles.include([
    'package.json'
    , 'tmp_publish/**'
  ]);
  this.publishCmd = 'node -p -e "\'%filename\'"';
  this.gitCmd = 'echo'
  this.scheduleDelay = 0;

  this._ensureRepoClean = function () {};
  this._getCurrentBranch = function () {
    return 'v0.0'
  };
});

jake.setTaskTimeout(5000);

jake.Task['publish'].on('complete', function () {
  rmRf('tmp_publish', {silent: true});
  rmRf('package.json', {silent: true});
});

