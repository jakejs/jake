// Load the jake global
require('../lib/jake');

let assert = require('assert');
let exec = require('child_process').execSync;

suite('namespace', function () {

  this.timeout(7000);

  setup(function () {
    process.chdir('./test');
  });

  teardown(function () {
    process.chdir('../');
  });

  test('resolve namespace by relative name', function () {
    let foo;
    let bar;
    let baz;

    foo = namespace('foo', function () {
      bar = namespace('bar', function () {
        baz = namespace('baz', function () {
        });
      });
    });

    assert.ok(foo === baz.resolveNamespace('foo'),
      'foo -> "foo"');
    assert.ok(bar === baz.resolveNamespace('foo:bar'),
      'bar -> "foo:bar"');
    assert.ok(bar === baz.resolveNamespace('bar'),
      'bar -> "bar"');
    assert.ok(baz === baz.resolveNamespace('foo:bar:baz'),
      'baz -> "foo:bar:baz"');
    assert.ok(baz === baz.resolveNamespace('bar:baz'),
      'baz -> "bar:baz"');
  });

  test('modifying a namespace by adding a new task', function () {
    let out = exec('./node_modules/.bin/jake -q one:two').toString().trim();
    assert.equal('one:one\none:two', out);
  });

});
