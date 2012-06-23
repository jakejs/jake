var assert = require('assert')
  , fs = require('fs')
  , h = require('./helpers')
  , fileUtils = require('../lib/utils/file');

var tests = {

  'before': function () {
    process.chdir('./tests');
  }

, 'after': function () {
    process.chdir('../');
  }

, 'test mkdirP': function () {
    var expected = [
          'foo'
        , 'foo/bar'
        , 'foo/bar/baz'
        , 'foo/bar/baz/qux'
        ]
      , res;
    fileUtils.mkdirP('foo/bar/baz/qux');
    res = fileUtils.readdirR('foo');
    for (var i = 0, ii = res.length; i < ii; i++) {
      assert.equal(expected[i], res[i]);
    }
    fileUtils.rmRf('foo', {silent: true});
  }

, 'test rmRf': function () {
    fileUtils.mkdirP('foo/bar/baz/qux', {silent: true});
    fileUtils.rmRf('foo/bar', {silent: true});
    res = fileUtils.readdirR('foo');
    assert.equal(1, res.length);
    assert.equal('foo', res[0]);
    fs.rmdirSync('foo');
  }

};

module.exports = tests;


