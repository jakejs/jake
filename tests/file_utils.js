var assert = require('assert')
  , fs = require('fs')
  , h = require('./helpers')
  , fileUtils = require('../lib/utils/file');

// Kill output
global.jake = {
  program: {
    opts: {
      quiet: true
    }
  }
};

process.chdir('./tests');

var tests = {

  'test mkdirP': function () {
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
    fileUtils.rmRf('foo');
    h.next();
  }

, 'test rmRf': function () {
    fileUtils.mkdirP('foo/bar/baz/qux');
    fileUtils.rmRf('foo/bar');
    res = fileUtils.readdirR('foo');
    assert.equal(1, res.length);
    assert.equal('foo', res[0]);
    fs.rmdirSync('foo');
    h.next();
  }

};


h.run(tests, function () {
  process.chdir('../');
});


