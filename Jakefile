
desc('Runs the Jake tests.');
task('test', function () {
  cmds = [
    'node ./tests/parseargs.js'
  , 'node ./tests/task_base.js'
  , 'node ./tests/file_task.js'
  ];
  jake.exec(cmds, function () {
    console.log('All tests passed.');
    complete();
  }, {stdout: true});
});

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

