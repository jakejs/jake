let assert = require('assert');
let h = require('./helpers');
let exec = require('child_process').execSync;

suite('taskBase', function () {

  this.timeout(7000);

  setup(function () {
    process.chdir('./test');
  });

  teardown(function () {
    process.chdir('../');
  });

  test('default task', function () {
    let out;
    out = exec('./node_modules/.bin/jake -q').toString().trim();
    assert.equal(out, 'default task');
    out = exec('./node_modules/.bin/jake -q default').toString().trim();
    assert.equal(out, 'default task');
  });

  test('task with no action', function () {
    let out = exec('./node_modules/.bin/jake -q noAction').toString().trim();
    assert.equal(out, 'default task');
  });

  test('a task with no action and no prereqs', function () {
    exec('./node_modules/.bin/jake noActionNoPrereqs');
  });

  test('passing args to a task', function () {
    let out = exec('./node_modules/.bin/jake -q argsEnvVars[foo,bar]').toString().trim();
    let parsed = h.parse(out);
    let args = parsed.args;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
  });

  test('a task with environment vars', function () {
    let out = exec('./node_modules/.bin/jake -q argsEnvVars foo=bar baz=qux').toString().trim();
    let parsed = h.parse(out);
    let env = parsed.env;
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('passing args and using environment vars', function () {
    let out = exec('./node_modules/.bin/jake -q argsEnvVars[foo,bar] foo=bar baz=qux').toString().trim();
    let parsed = h.parse(out);
    let args = parsed.args;
    let env = parsed.env;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('a simple prereq', function () {
    let out = exec('./node_modules/.bin/jake -q foo:baz').toString().trim();
    assert.equal(out, 'foo:bar task\nfoo:baz task');
  });

  test('a duplicate prereq only runs once', function () {
    let out = exec('./node_modules/.bin/jake -q foo:asdf').toString().trim();
    assert.equal(out, 'foo:bar task\nfoo:baz task\nfoo:asdf task');
  });

  test('a prereq with command-line args', function () {
    let out = exec('./node_modules/.bin/jake -q foo:qux').toString().trim();
    assert.equal(out, 'foo:bar[asdf,qwer] task\nfoo:qux task');
  });

  test('a prereq with args via invoke', function () {
    let out = exec('./node_modules/.bin/jake -q foo:frang[zxcv,uiop]').toString().trim();
    assert.equal(out, 'foo:bar[zxcv,uiop] task\nfoo:frang task');
  });

  test('a prereq with args via execute', function () {
    let out = exec('./node_modules/.bin/jake -q foo:zerb[zxcv,uiop]').toString().trim();
    assert.equal(out, 'foo:bar[zxcv,uiop] task\nfoo:zerb task');
  });

  test('repeating the task via execute', function () {
    let out = exec('./node_modules/.bin/jake -q foo:voom').toString().trim();
    assert.equal(out, 'foo:bar task\nfoo:bar task\ncomplete\ncomplete');
  });

  test('prereq execution-order', function () {
    let out = exec('./node_modules/.bin/jake -q hoge:fuga').toString().trim();
    assert.equal(out, 'hoge:hoge task\nhoge:piyo task\nhoge:fuga task');
  });

  test('basic async task', function () {
    let out = exec('./node_modules/.bin/jake -q bar:bar').toString().trim();
    assert.equal(out, 'bar:foo task\nbar:bar task');
  });

  test('promise async task', function () {
    let out = exec('node ../bin/cli.js -q bar:dependOnpromise').toString().trim();
    assert.equal(out, 'bar:promise task\nbar:dependOnpromise task saw value 123654');
  });

  test('failing promise async task', function () {
    try {
      exec('node ../bin/cli.js -q bar:brokenPromise');
    }
    catch(e) {
      assert(e.message.indexOf('Command failed') > -1);
    }
  });

  test('that current-prereq index gets reset', function () {
    let out = exec('./node_modules/.bin/jake -q hoge:kira').toString().trim();
    assert.equal(out, 'hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
        'hoge:charan task\nhoge:gero task\nhoge:kira task');
  });

  test('modifying a task by adding prereq during execution', function () {
    let out = exec('./node_modules/.bin/jake -q voom').toString().trim();
    assert.equal(out, 2);
  });

  test('listening for task error-event', function () {
    try {
      exec('./node_modules/.bin/jake -q vronk:groo').toString().trim();
    }
    catch(e) {
      assert(e.message.indexOf('OMFGZONG') > -1);
    }
  });

  test('listening for jake error-event', function () {
    let out = exec('./node_modules/.bin/jake -q throwy').toString().trim();
    assert(out.indexOf('Emitted\nError: I am bad') > -1);
  });

  test('large number of same prereqs', function () {
    let out = exec('./node_modules/.bin/jake -q large:same').toString().trim();
    assert.equal(out, 'large:leaf\nlarge:same');
  });

  test('large number of different prereqs', function () {
    let out = exec('./node_modules/.bin/jake -q large:different').toString().trim();
    assert.equal(out, 'leaf-12\nleaf-123\nlarge:different');
  });

  test('large number of different prereqs', function () {
    let out = exec('./node_modules/.bin/jake -q usingRequire:test').toString().trim();
    assert.equal(out, 'howdy test');
  });

});
