let assert = require('assert');
let h = require('./helpers');
let exec = require('child_process').execSync;
let utils = require('utilities');

function _getAutoCompleteOpts(args) {
  return {
    execOpts: {
      env: utils.object.merge({
        COMP_LINE: 'node jake ' + args.join(' ')
      }, process.env)
    }
  };
}

function _getAutoCompleteExecArgs(args) {
  let nArgs = args.length;
  return args[nArgs - 1]+' '+(nArgs > 1 ? args[nArgs - 2] : '');
}

suite('taskBase', function () {

  setup(function () {
    process.chdir('./test');
  });

  teardown(function () {
    process.chdir('../');
  });

  test('default task', function () {
    this.timeout(4000);
    let out;
    out = exec('../bin/cli.js -q').toString().trim();
    assert.equal('default task', out);
    out = exec('../bin/cli.js -q default').toString().trim();
    assert.equal('default task', out);
  });

  test('task with no action', function () {
    let out = exec('../bin/cli.js -q noAction').toString().trim();
    assert.equal('default task', out);
  });

  test('a task with no action and no prereqs', function () {
    exec('../bin/cli.js noActionNoPrereqs');
  });

  test('passing args to a task', function () {
    let out = exec('../bin/cli.js -q argsEnvVars[foo,bar]').toString().trim();
    let parsed = h.parse(out);
    let args = parsed.args;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
  });

  test('a task with environment vars', function () {
    let out = exec('../bin/cli.js -q argsEnvVars foo=bar baz=qux').toString().trim();
    let parsed = h.parse(out);
    let env = parsed.env;
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('passing args and using environment vars', function () {
    let out = exec('../bin/cli.js -q argsEnvVars[foo,bar] foo=bar baz=qux').toString().trim();
    let parsed = h.parse(out);
    let args = parsed.args;
    let env = parsed.env;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('a simple prereq', function () {
    let out = exec('../bin/cli.js -q foo:baz').toString().trim();
    assert.equal('foo:bar task\nfoo:baz task', out);
  });

  test('a duplicate prereq only runs once', function () {
    let out = exec('../bin/cli.js -q foo:asdf').toString().trim();
    assert.equal('foo:bar task\nfoo:baz task\nfoo:asdf task', out);
  });

  test('a prereq with command-line args', function () {
    let out = exec('../bin/cli.js -q foo:qux').toString().trim();
    assert.equal('foo:bar[asdf,qwer] task\nfoo:qux task', out);
  });

  test('a prereq with args via invoke', function () {
    let out = exec('../bin/cli.js -q foo:frang[zxcv,uiop]').toString().trim();
    assert.equal('foo:bar[zxcv,uiop] task\nfoo:frang task', out);
  });

  test('a prereq with args via execute', function () {
    let out = exec('../bin/cli.js -q foo:zerb[zxcv,uiop]').toString().trim();
    assert.equal('foo:bar[zxcv,uiop] task\nfoo:zerb task', out);
  });

  test('prereq execution-order', function (next) {
    h.exec('../bin/cli.js -q hoge:fuga', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task', out);
      next();
    });
  });

  test('basic async task', function (next) {
    h.exec('../bin/cli.js -q bar:bar', function (out) {
      assert.equal('bar:foo task\nbar:bar task', out);
      next();
    });
  });

  test('promise async task', function (next) {
    h.exec('node ../bin/cli.js -q bar:dependOnpromise', function (out) {
      assert.equal('bar:promise task\nbar:dependOnpromise task saw value 123654', out);
      next();
    });
  });

  test('failing promise async task', function (next) {
    h.exec('node ../bin/cli.js -q bar:brokenPromise', {breakOnError:false}, function (out) {
      assert.equal(1, out.code);
      next();
    });
  });

  test('that current-prereq index gets reset', function (next) {
    h.exec('../bin/cli.js -q hoge:kira', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
          'hoge:charan task\nhoge:gero task\nhoge:kira task', out);
      next();
    });
  });

  test('modifying a task by adding prereq during execution', function (next) {
    h.exec('../bin/cli.js -q voom', function (out) {
      assert.equal(2, out);
      next();
    });
  });

  test('listening for task error-event', function (next) {
    h.exec('../bin/cli.js -q vronk:groo', function (out) {
      assert.equal('OMFGZONG', out);
      next();
    });
  });

  test('listening for jake error-event', function (next) {
    h.exec('../bin/cli.js -q throwy', function (out) {
      assert.equal(out, 'Emitted: Error: I am bad');
      next();
    });
  });

  test('large number of same prereqs', function (next) {
    h.exec('../bin/cli.js -q large:same', function (out) {
      assert.equal(out, 'large:leaf\nlarge:same');
      next();
    });
  });

  test('large number of different prereqs', function (next) {
    h.exec('../bin/cli.js -q large:different', function (out) {
      assert.equal(out, 'leaf-12\nleaf-123\nlarge:different');
      next();
    });
  });

});
