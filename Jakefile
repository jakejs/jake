var fs = require('fs')
  , path = require('path');

namespace('doc', function () {
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    jake.logger.log('Generating docs ...');
    jake.exec([cmd], function () {
      jake.logger.log('Done.');
      complete();
    });
  }, {async: true});

  task('clobber', function () {
    var cmd = 'rm -fr ./doc/*';
    jake.exec([cmd], function () {
      jake.logger.log('Clobbered old docs.');
      complete();
    });
  }, {async: true});

});

desc('Generate docs for Jake');
task('doc', ['doc:generate']);

npmPublishTask('jake', function () {
  this.packageFiles.include([
    'Makefile',
    'Jakefile',
    'README.md',
    'package.json',
    'usage.txt',
    'lib/**',
    'bin/**',
    'test/**'
    ]);
  this.packageFiles.exclude([
    'test/tmp'
  ]);
});

task('test', ['package'], async function (name) {
  let proc = require('child_process');
  let pkg = JSON.parse(fs.readFileSync('./package.json').toString());
  let version = pkg.version;

  // Install from the actual package, run tests from the packaged binary
  proc.execSync('mkdir -p ./test/node_modules/.bin && mv ./pkg/jake-v' +
      version + ' ./test/node_modules/jake && ln -s ' + process.cwd() +
    '/test/node_modules/jake/bin/cli.js ./test/node_modules/.bin/jake');

  let testArgs = [];
  if (name) {
    testArgs.push(name);
  }
  let spawned = proc.spawn('./node_modules/.bin/mocha', testArgs, {
    stdio: 'inherit'
  });
  return new Promise((resolve, reject) => {
    spawned.on('exit', () => {
      proc.execSync('rm -rf test/tmp_publish && rm -rf test/package.json' +
          ' && rm -rf test/package-lock.json && rm -rf test/node_modules && rm -rf pkg');
      resolve();
    });
  });
});
