let assert = require('assert');
let {execSync: exec} = require('child_process');

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
    try {
      exec('./node_modules/.bin/jake selfdepconst');
    }
    catch(e) {
      assert(e.message.indexOf('dependency of itself') > -1)
    }
  });

  test('self dep dyn', function () {
    try {
      exec('./node_modules/.bin/jake selfdepdyn');
    }
    catch(e) {
      assert(e.message.indexOf('dependency of itself') > -1)
    }
  });

});


