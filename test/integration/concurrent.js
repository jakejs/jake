let assert = require('assert');
let { execJake } = require('./helpers');

suite('concurrent', function () {

  this.timeout(7000);

  test(' simple concurrent prerequisites 1', function () {
    let out = execJake('-q concurrent:simple1');
    assert.equal('Started A\nStarted B\nFinished B\nFinished A', out);
  });

  test(' simple concurrent prerequisites 2', function () {
    let out = execJake('-q concurrent:simple2');
    assert.equal('Started C\nStarted D\nFinished C\nFinished D', out);
  });

  test(' sequential concurrent prerequisites', function () {
    let out = execJake('-q concurrent:seqconcurrent');
    assert.equal('Started A\nStarted B\nFinished B\nFinished A\nStarted C\nStarted D\nFinished C\nFinished D', out);
  });

  test(' concurrent concurrent prerequisites', function () {
    let out = execJake('-q concurrent:concurrentconcurrent');
    assert.equal('Started A\nStarted B\nStarted C\nStarted D\nFinished B\nFinished C\nFinished A\nFinished D', out);
  });

  test(' concurrent prerequisites with subdependency', function () {
    let out = execJake('-q concurrent:subdep');
    assert.equal('Started A\nFinished A\nStarted Ba\nFinished Ba', out);
  });

  test(' failing in concurrent prerequisites', function () {
    try {
      execJake('-q concurrent:Cfail');
    }
    catch(err) {
      assert(err.message.indexOf('Command failed') > -1);
    }
  });

});
