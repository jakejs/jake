
var assert = require('assert')
  , h = require('./helpers')
  , fs = require('fs')
  , utils = require('utilities');

var tests = {

  'before': function () {
    process.chdir('./test');
    // Create some source files to work with
    fs.writeFileSync('package.json', '{"version": "0.0.1"}');
    utils.file.mkdirP('tmp_publish');
    fs.writeFileSync('tmp_publish/foo.txt', 'FOO');
  }

, 'after': function () {
    utils.file.rmRf('tmp_publish', {silent: true});
    utils.file.rmRf('package.json', {silent: true});
    process.chdir('../');
  }

, 'test default task': function (next) {
    h.exec('../bin/cli.js  -f Jakefile.publish publish', function (out) {
      var expected = [
            'Fetched remote tags.'
          , 'On branch v0.0'
          , 'Bumped version number to v0.0.2.'
          , 'Created package for zerb v0.0.2'
          , 'Publishing zerb v0.0.2'
          , 'pkg/zerb-v0.0.2.tar.gz'
          , 'Published to NPM'
          , 'Cleaned up package'
          ].join('\n');
      assert.equal(expected, out);
      next();
    });
  }

};

module.exports = tests;


