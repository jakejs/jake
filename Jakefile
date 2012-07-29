
var t = new jake.TestTask('Jake', function () {
  this.testFiles.include('test/*.js');
});

var p = new jake.NpmPublishTask('jake', [
  'Jakefile'
, 'README.md'
, 'package.json'
, 'lib/**'
, 'test/**'
]);

