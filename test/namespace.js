var assert = require('assert')
  , h = require('./helpers')
  , jake = {}
  , utils = require('../lib/utils');

utils.mixin(jake, utils);

var tests = {
  'before': function() {
    process.chdir('./test');
  }

, 'after': function() {
    process.chdir('../');
  }

, 'test modifying a namespace by adding a new task': function(next) {
    h.exec('../bin/cli.js one:two', function(out) {
      assert.equal('one:one\none:two', out);
      next();
    });
  }

};

module.exports = tests;

