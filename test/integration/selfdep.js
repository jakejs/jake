let assert = require('assert');
const { execJake } = require('./helpers');

suite('selfDep', function () {

  this.timeout(7000);

  let origStderrWrite;

  setup(function () {
    origStderrWrite = process.stderr.write;
    process.stderr.write = function () {};
  });

  teardown(function () {
    process.stderr.write = origStderrWrite;
  });

  test('self dep const', function () {
    assert.throws(
      () => execJake('selfdepconst'),
      (error) => error.message.indexOf('dependency of itself') > -1,
    );
  });

  test('self dep dyn', function () {
    assert.throws(
      () => execJake('selfdepdyn'),
      (error) => error.message.indexOf('dependency of itself') > -1,
    );
  });

});


