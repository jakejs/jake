require('package_task');
require('file_list');

var fs = require('fs')
  , pkg = JSON.parse(fs.readFileSync('package.json').toString())
  , version = pkg.version

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
  this.needTarGz = true;
  this.packageFiles.include(fileList);
});


