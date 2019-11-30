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

  this.timeout(4000);

  setup(function () {
    process.chdir('./test');
  });

  teardown(function () {
    process.chdir('../');
  });

  test('default task', function () {
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

  test('prereq execution-order', function () {
    let out = exec('../bin/cli.js -q hoge:fuga').toString().trim();
    assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task', out);
  });

  test('basic async task', function () {
    let out = exec('../bin/cli.js -q bar:bar').toString().trim();
    assert.equal('bar:foo task\nbar:bar task', out);
  });

  test('promise async task', function () {
    let out = exec('node ../bin/cli.js -q bar:dependOnpromise').toString().trim();
    assert.equal('bar:promise task\nbar:dependOnpromise task saw value 123654', out);
  });

  test('failing promise async task', function () {
    try {
      let out = exec('node ../bin/cli.js -q bar:brokenPromise');
    }
    catch(e) {
      assert(e.message.indexOf('Command failed') > -1);
    }
  });

  test('that current-prereq index gets reset', function () {
    let out = exec('../bin/cli.js -q hoge:kira').toString().trim();
    assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
        'hoge:charan task\nhoge:gero task\nhoge:kira task', out);
  });

  test('modifying a task by adding prereq during execution', function () {
    let out = exec('../bin/cli.js -q voom').toString().trim();
    assert.equal(2, out);
  });

  test('listening for task error-event', function () {
    try {
      let out = exec('../bin/cli.js -q vronk:groo').toString().trim();
    }
    catch(e) {
      assert(e.message.indexOf('OMFGZONG') > -1);
    }
  });

  test('listening for jake error-event', function () {
    let out = exec('../bin/cli.js -q throwy').toString().trim();
    assert(out.indexOf('Emitted\nError: I am bad') > -1);
  });

  test('large number of same prereqs', function () {
    let out = exec('../bin/cli.js -q large:same').toString().trim();
    assert.equal(out, 'large:leaf\nlarge:same');
  });

  test('large number of different prereqs', function () {
    let out = exec('../bin/cli.js -q large:different').toString().trim();
    assert.equal(out, 'leaf-12\nleaf-123\nlarge:different');
  });

});
