var assert = require('assert')
  , h = require('./helpers')
  , jake = {}
  , utils = require('../lib/utils');

utils.mixin(jake, utils);

process.chdir('./tests');

var tests = new (function () {
  this.testBasicExec = function () {
    var ex = jake.createExec('ls', function () {})
      , evts = { // Events should fire in this order
          cmdStart: [0, null]
        , stdout: [1, null]
        , cmdEnd: [2, null]
        , end: [3, null]
        }
      , incr = 0; // Increment with each event to check order
    assert.ok(ex instanceof jake.Exec);
    // Make sure basic events fire and fire in the right order
    for (var p in evts) {
      (function (p) {
        ex.addListener(p, function () {
          evts[p][1] = incr;
          incr++;
        });
      })(p);
    }
    ex.run();
    ex.addListener('end', function () {
      for (var p in evts) {
        assert.equal(evts[p][0], evts[p][1]);
      }
    });

    h.next();
  };

  this.testExecFailure = function () {
    var ex = jake.createExec('false', function () {});
    ex.addListener('error', function (msg, code) {
      assert.equal(1, code);
    });
    ex.run();
    h.next();
  };

  this.testStdout = function () {
    var ex = jake.createExec('echo "foo"', function () {});
    ex.addListener('stdout', function (data) {
      assert.equal("foo", h.trim(data.toString()));
    });
    ex.run();
    h.next();
  };

  this.testStderr = function () {
    var ex = jake.createExec('echo "foo" 1>&2', function () {});
    ex.addListener('stderr', function (data) {
      assert.equal("foo", h.trim(data.toString()));
    });
    ex.run();
    h.next();
  };

})();

h.run(tests, function () {
  process.chdir('../');
});


