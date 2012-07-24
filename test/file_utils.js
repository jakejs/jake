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

// TODO: Need Windows test with c:\\
, 'test basedir with Unix absolute path': function () {
    var p = '/foo/bar/baz';
    assert.equal('/', fileUtils.basedir(p));
  }

, 'test basedir with Unix absolute path and double-asterisk': function () {
    var p = '/**/foo/bar/baz';
    assert.equal('/', fileUtils.basedir(p));
  }

, 'test basedir with leading double-asterisk': function () {
    var p = '**/foo';
    assert.equal('.', fileUtils.basedir(p));
  }

, 'test basedir with leading asterisk': function () {
    var p = '*.js';
    assert.equal('.', fileUtils.basedir(p));
  }

, 'test basedir with leading dot-slash and double-asterisk': function () {
    var p = './**/foo';
    assert.equal('.', fileUtils.basedir(p));
  }

, 'test basedir with leading dirname and double-asterisk': function () {
    var p = 'a/**/*.js';
    assert.equal('a', fileUtils.basedir(p));
  }

, 'test basedir with leading dot-dot-slash and double-asterisk': function () {
    var p = '../test/**/*.js';
    assert.equal('..', fileUtils.basedir(p));
  }

};

module.exports = tests;


