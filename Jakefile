var fs = require('fs')
  , pkg = JSON.parse(fs.readFileSync('./package.json').toString())
  , version = pkg.version

desc('Runs the Jake tests.');
task('test', function () {
  cmds = [
    'node ./tests/parseargs.js'
  , 'node ./tests/task_base.js'
  ];
  jake.exec(cmds, function () {
    console.log('All tests passed.');
    complete();
  });
});

var t = new jake.PackageTask('jake', 'v' + version, function () {
  var fileList = [
    'Makefile'
  , 'Jakefile'
  , 'README.md'
  , 'package.json'
  , 'lib/*'
  , 'bin/*'
  , 'tests/*'
  ];
  this.packageFiles.include(fileList);
  this.needTarGz = true;
  this.needTarBz2 = true;
});


