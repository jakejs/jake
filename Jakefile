var fs = require('fs')
  , path = require('path');

var t = new jake.TestTask('Jake', function () {
  this.testFiles.include('test/*.js');
  this.testFiles.exclude('test/helpers.js');
});

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

var p = new jake.NpmPublishTask('jake', [
  'Makefile'
, 'Jakefile'
, 'README.md'
, 'package.json'
, 'lib/**'
, 'bin/**'
, 'test/**'
]);


