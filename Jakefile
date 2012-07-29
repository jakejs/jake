
var t = new jake.TestTask('Utilities', function () {
  this.testFiles.include('test/*.js');
});

var p = new jake.NpmPublishTask('utilities', [
  'Jakefile'
, 'README.md'
, 'package.json'
, 'lib/**'
, 'test/**'
]);

jake.Task['npm:definePackage'].invoke();

