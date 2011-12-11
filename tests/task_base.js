var assert = require('assert')
  , h = require('./helpers');

process.chdir('./tests');

var tests = new (function () {
  this.testDefault = function () {
    h.exec('../bin/cli.js', function (out) {
      assert.equal('default task', out);
    });

    h.exec('../bin/cli.js default', function (out) {
      assert.equal('default task', out);
    });
  };

  this.testWithArgs = function () {
    h.exec('../bin/cli.js argsEnvVars[foo,bar]', function (out) {
      var parsed = h.parse(out)
        , args = parsed.args;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
    });
  };

  this.testWithEnvVars = function () {
    h.exec('../bin/cli.js argsEnvVars foo=bar baz=qux', function (out) {
      var parsed = h.parse(out)
        , env = parsed.env;
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
    });
  };

  this.testWithArgsAndEnvVars = function () {
    h.exec('../bin/cli.js argsEnvVars[foo,bar] foo=bar baz=qux', function (out) {
      var parsed = h.parse(out)
        , args = parsed.args
        , env = parsed.env;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
    });
  };

  this.testPrereq = function () {
    h.exec('../bin/cli.js foo:baz', function (out) {
      assert.equal('foo:bar task\nfoo:baz task', out);
    });
  };

  this.testPrereqWithCmdlineArgs = function () {
    h.exec('../bin/cli.js foo:qux', function (out) {
      assert.equal('foo:bar[asdf,qwer] task\nfoo:qux task', out);
    });
  };

  this.testPrereqWithArgsViaInvoke = function () {
    h.exec('../bin/cli.js foo:frang', function (out) {
      assert.equal('foo:bar[zxcv,uiop] task\nfoo:frang task', out);
    });
  };

})();

for (var p in tests) {
  if (typeof tests[p] == 'function') {
    tests[p]();
  }
}

process.chdir('../');

