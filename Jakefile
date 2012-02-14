
desc('Runs the Jake tests.');
task('test', function () {
  var cmds = [
    'node ./tests/parseargs.js'
  , 'node ./tests/task_base.js'
  , 'node ./tests/file_task.js'
  ];
  jake.exec(cmds, function () {
    console.log('All tests passed.');
    complete();
  }, {stdout: true});
}, {async: true});

namespace('doc', function () {
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    jake.exec([cmd], function () {
      console.log('Done.');
      complete();
    });
  }, {async: true});

  task('clobber', function () {
    var cmd = 'rm -fr ./doc/*';
    jake.exec([cmd], function () {
      console.log('Clobbered old docs.');
      complete();
    });
  }, {async: true});

});

desc('Generate docs for Jake');
task('doc', ['doc:generate']);

var p = new jake.NpmPublishTask('jake', [
  'Makefile'
, 'Jakefile'
, 'README.md'
, 'package.json'
, 'lib/*'
, 'bin/*'
, 'tests/*'
]);

jake.Task['npm:definePackage'].invoke();

