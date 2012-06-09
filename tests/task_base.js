var assert = require('assert')
  , h = require('./helpers');

process.chdir('./tests');

var tests = {
  'test default task': function () {
    h.exec('../bin/cli.js', function (out) {
      assert.equal('default task', out);
    });

    h.exec('../bin/cli.js default', function (out) {
      assert.equal('default task', out);
    });
    h.next();
  }

, 'test task with no action': function () {
    h.exec('../bin/cli.js noAction', function (out) {
      assert.equal('default task', out);
    });
    h.next();
  }

, 'test a task with no action and no prereqs': function () {
    h.exec('../bin/cli.js noActionNoPrereqs', function () {});
    h.next();
  }

, 'test passing args to a task': function () {
    h.exec('../bin/cli.js argsEnvVars[foo,bar]', function (out) {
      var parsed = h.parse(out)
        , args = parsed.args;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
    });
    h.next();
  }

, 'test a task with environment vars': function () {
    h.exec('../bin/cli.js argsEnvVars foo=bar baz=qux', function (out) {
      var parsed = h.parse(out)
        , env = parsed.env;
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
    });
    h.next();
  }

, 'test passing args and using environment vars': function () {
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
  }

, 'test a simple prereq': function () {
    h.exec('../bin/cli.js foo:baz', function (out) {
      assert.equal('foo:bar task\nfoo:baz task', out);
    });
    h.next();
  }

, 'test a duplicate prereq only runs once': function () {
    h.exec('../bin/cli.js foo:asdf', function (out) {
      assert.equal('foo:bar task\nfoo:baz task\nfoo:asdf task', out);
    });
    h.next();
  }

, 'test a prereq with command-line args': function () {
    h.exec('../bin/cli.js foo:qux', function (out) {
      assert.equal('foo:bar[asdf,qwer] task\nfoo:qux task', out);
    });
    h.next();
  }

, 'test a prereq with args via invoke': function () {
    h.exec('../bin/cli.js foo:frang[zxcv,uiop]', function (out) {
      assert.equal('foo:bar[zxcv,uiop] task\nfoo:frang task', out);
    });
    h.next();
  }

, 'test prereq execution-order': function () {
    h.exec('../bin/cli.js hoge:fuga', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task', out);
    });
    h.next();
  }

, 'test basic async task': function () {
    h.exec('../bin/cli.js bar:bar', function (out) {
      assert.equal('bar:foo task\nbar:bar task', out);
    });
    h.next();
  }

, 'test that current-prereq index gets reset': function () {
    h.exec('../bin/cli.js hoge:kira', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
          'hoge:charan task\nhoge:gero task\nhoge:kira task', out);
    });
    h.next();
  }

, 'test modifying a task by adding prereq during execution': function () {
    h.exec('../bin/cli.js voom', function (out) {
      assert.equal(2, out);
    });
    h.next();
  }

};

h.run(tests, function () {
  process.chdir('../');
});

