let assert = require('assert');
let { execJake, spawnJake, parse } = require('./helpers');

suite('taskBase', function () {

  this.timeout(7000);

  test('default task', function () {
    let out = execJake('-q');
    assert.equal(out, 'default task');
    out = execJake(`-q default`);
    assert.equal(out, 'default task');
  });

  test('task with no action', function () {
    let out = execJake('-q noAction');
    assert.equal(out, 'default task');
  });

  test('a task with no action and no prereqs', function () {
    execJake('noActionNoPrereqs');
  });

  test('a task that exists at the top-level, and not in the specified namespace, should error', function () {
    let res = spawnJake([ 'asdfasdfasdf:zerbofrangazoomy' ], { stdio: [ 'inherit', 'inherit', 'pipe' ] });
    let err = res.stderr.toString();
    assert.ok(err.indexOf('Unknown task') > -1);
  });

  test('passing args to a task', function () {
    let out = execJake('-q argsEnvVars[foo,bar]');
    let parsed = parse(out);
    let args = parsed.args;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
  });

  test('a task with environment vars', function () {
    let out = execJake('-q argsEnvVars foo=bar baz=qux');
    let parsed = parse(out);
    let env = parsed.env;
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('passing args and using environment vars', function () {
    let out = execJake('-q argsEnvVars[foo,bar] foo=bar baz=qux');
    let parsed = parse(out);
    let args = parsed.args;
    let env = parsed.env;
    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
    assert.equal(env.foo, 'bar');
    assert.equal(env.baz, 'qux');
  });

  test('a simple prereq', function () {
    let out = execJake('-q foo:baz');
    assert.equal(out, [ 'foo:bar task', 'foo:baz task' ].join("\n"));
  });

  test('a duplicate prereq only runs once', function () {
    let out = execJake('-q foo:asdf');
    assert.equal(out, [ 'foo:bar task', 'foo:baz task', 'foo:asdf task' ].join("\n"));
  });

  test('a prereq with command-line args', function () {
    let out = execJake('-q foo:qux');
    assert.equal(out, [ 'foo:bar[asdf,qwer] task', 'foo:qux task' ].join("\n"));
  });

  test('a prereq with args via invoke', function () {
    let out = execJake('-q foo:frang[zxcv,uiop]');
    assert.equal(out, [ 'foo:bar[zxcv,uiop] task', 'foo:frang task' ].join("\n"));
  });

  test('a prereq with args via execute', function () {
    let out = execJake('-q foo:zerb[zxcv,uiop]');
    assert.equal(out, [ 'foo:bar[zxcv,uiop] task', 'foo:zerb task' ].join("\n"));
  });

  test('repeating the task via execute', function () {
    let out = execJake('-q foo:voom');
    assert.equal(out, [ 'foo:bar task', 'foo:bar task', 'complete', 'complete' ].join("\n"));
  });

  test('prereq execution-order', function () {
    let out = execJake('-q hoge:fuga');
    assert.equal(out, [ 'hoge:hoge task', 'hoge:piyo task', 'hoge:fuga task' ].join("\n"));
  });

  test('basic async task', function () {
    let out = execJake('-q bar:bar');
    assert.equal(out, [ 'bar:foo task', 'bar:bar task' ].join("\n"));
  });

  test('promise async task', function () {
    let out = execJake('-q bar:dependOnpromise');
    assert.equal(out, [ 'bar:promise task', 'bar:dependOnpromise task saw value 123654' ].join("\n"));
  });

  test('failing promise async task', function () {
    assert.throws(() => execJake('-q bar:brokenPromise'), /Command failed/);
  });

  test('that current-prereq index gets reset', function () {
    let out = execJake('-q hoge:kira');
    assert.equal(out, [
      'hoge:hoge task',
      'hoge:piyo task',
      'hoge:fuga task',
      'hoge:charan task',
      'hoge:gero task',
      'hoge:kira task',
    ].join("\n"));
  });

  test('modifying a task by adding prereq during execution', function () {
    let out = execJake('-q voom');
    assert.equal(out, 2);
  });

  test('listening for task error', function () {
    assert.throws(() => execJake('vronk:zong'), /OMFGZONG/);
  });

  test('listening for task error-event', function () {
    const out = execJake('vronk:groo');
    assert.match(out, /OMFGZONG/);
  });

  test('listening for jake error-event', function () {
    let out = execJake('-q throwy');
    assert.match(out, /Emitted\nError: I am bad/);
  });

  test('listening for jake unhandledRejection-event', function () {
    let out = execJake('-q promiseRejecter');
    assert.equal(out, '<promise rejected on purpose>');
  });

  test('large number of same prereqs', function () {
    let out = execJake('-q large:same');
    assert.equal(out, [ 'large:leaf', 'large:same' ].join("\n"));
  });

  test('large number of different prereqs', function () {
    let out = execJake('-q large:different');
    assert.equal(out, [ 'leaf-12', 'leaf-123', 'large:different' ].join("\n"));
  });

  test('large number of different prereqs', function () {
    let out = execJake('-q usingRequire:test');
    assert.equal(out, 'howdy test');
  });

  test('modifying a namespace by adding a new task', function () {
    let out = execJake('-q one:two');
    assert.equal(out, [ 'one:one', 'one:two' ].join("\n"));
  });

});
