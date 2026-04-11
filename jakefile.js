let fs = require('fs');
let path = require('path');
let proc = require('child_process');

const PROJECT_DIR = process.cwd();
process.env.PROJECT_DIR = PROJECT_DIR;
const MOCHA_BIN = require.resolve('mocha/bin/mocha.js');
const ESLINT_BIN = path.join(path.dirname(require.resolve('eslint/package.json')), 'bin', 'eslint.js');

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
    'jakefile.js',
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

jake.Task['publish:package'].directory = PROJECT_DIR;

namespace('test', function () {

  let integrationTest = task('integration', async function () {
    let testArgs = [];
    if (process.env.filter) {
      testArgs.push(process.env.filter);
    }
    else {
      testArgs.push('*.js');
    }
    let spawned = proc.spawn(process.execPath, [MOCHA_BIN].concat(testArgs), {
      stdio: 'inherit'
    });
    return new Promise((resolve, reject) => {
      spawned.on('exit', () => {
        resolve();
      });
    });

  });
  integrationTest.directory = `${PROJECT_DIR}/test/integration`;

  let integrationClobber = task('integrationClobber', function () {
    ['package.json', 'pkg', 'tmp_publish'].forEach(function (name) {
      fs.rmSync(path.join(`${PROJECT_DIR}/test/integration`, name), {
        recursive: true,
        force: true
      });
    });
  });
  integrationClobber.directory = `${PROJECT_DIR}/test/integration`;

  let unitTest = task('unit', async function () {
    let testArgs = [];
    if (process.env.filter) {
      testArgs.push(process.env.filter);
    }
    else {
      testArgs.push('*.js');
    }
    let spawned = proc.spawn(process.execPath, [MOCHA_BIN].concat(testArgs), {
      stdio: 'inherit'
    });
    return new Promise((resolve) => {
      spawned.on('exit', () => {
        resolve();
      });
    });
  });
  unitTest.directory = `${PROJECT_DIR}/test/unit`;

});

desc('Runs all tests');
task('test', ['test:unit', 'test:integration', 'test:integrationClobber']);

desc('Runs eslint for both lib and test directories');
task('lint', function (doFix) {
  let args = [ESLINT_BIN, '--format', 'codeframe', 'lib/**/*.js', 'test/**/*.js'];
  if (doFix) {
    args.push('--fix');
  }
  try {
    proc.execFileSync(process.execPath, args, {
      stdio: 'inherit'
    });
  }
  catch (err) {
    console.log(err.message);
    if (err.stderr) {
      console.log(err.stderr.toString());
    }
    if (err.stdout) {
      console.log(err.stdout.toString());
    }
    fail('eslint failed');
  }
});
