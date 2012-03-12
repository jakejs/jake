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
    h.next();
  };

  this.testNoAction = function () {
    h.exec('../bin/cli.js noAction', function (out) {
      assert.equal('default task', out);
    });
    h.next();
  };

  this.testNoActionNoPrereqs = function () {
    h.exec('../bin/cli.js noActionNoPrereqs', function () {});
    h.next();
  };

  this.testWithArgs = function () {
    h.exec('../bin/cli.js argsEnvVars[foo,bar]', function (out) {
      var parsed = h.parse(out)
        , args = parsed.args;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
    });
    h.next();
  };

  this.testWithEnvVars = function () {
    h.exec('../bin/cli.js argsEnvVars foo=bar baz=qux', function (out) {
      var parsed = h.parse(out)
        , env = parsed.env;
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
    });
    h.next();
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
    h.next();
  };

  this.testPrereq = function () {
    h.exec('../bin/cli.js foo:baz', function (out) {
      assert.equal('foo:bar task\nfoo:baz task', out);
    });
    h.next();
  };

  this.testSamePrereqTwice = function () {
    h.exec('../bin/cli.js foo:asdf', function (out) {
      assert.equal('foo:bar task\nfoo:baz task\nfoo:asdf task', out);
    });
    h.next();
  };

  this.testPrereqWithCmdlineArgs = function () {
    h.exec('../bin/cli.js foo:qux', function (out) {
      assert.equal('foo:bar[asdf,qwer] task\nfoo:qux task', out);
    });
    h.next();
  };

  this.testPrereqWithArgsViaInvoke = function () {
    h.exec('../bin/cli.js foo:frang[zxcv,uiop]', function (out) {
      assert.equal('foo:bar[zxcv,uiop] task\nfoo:frang task', out);
    });
    h.next();
  };

  this.testPrereqOrdering = function () {
    h.exec('../bin/cli.js hoge:fuga', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task', out);
    });
    h.next();
  };

  this.testAsync = function () {
    h.exec('../bin/cli.js bar:bar', function (out) {
      assert.equal('bar:foo task\nbar:bar task', out);
    });
    h.next();
  };

  this.testPrereqIndexReset = function () {
    h.exec('../bin/cli.js hoge:kira', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
          'hoge:charan task\nhoge:gero task\nhoge:kira task', out);
    });
    h.next();
  };

  this.modifyTaskAddPrereq = function () {
    h.exec('../bin/cli.js voom', function (out) {
      assert.equal(2, out);
    });
    h.next();
  };

})();

h.run(tests, function () {
  process.chdir('../');
});

