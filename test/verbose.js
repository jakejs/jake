var assert = require('assert')
  , h = require('./helpers')
  , _ = require('underscore');

var tests = {

  'before': function () {
    process.chdir('./test');
  }

, 'after': function () {
    process.chdir('../');
  }

, '--verbose should trace when a task starts': function (next) {
    h.exec('../bin/cli.js --verbose default', function (out) {
      var lines = out.split('\n');
      var executingNotifications = _.filter(lines, function(line) {
        return /^Executing/.test(line);
      });
      assert.deepEqual(executingNotifications, [
          'Executing default'
        ]);
      next();
    });
  }
  , '--verbose should trace when an action-less task starts': function (next) {
    h.exec('../bin/cli.js --verbose noActionNoPrereqs', function (out) {
      var lines = out.split('\n');
      var executingNotifications = _.filter(lines, function(line) {
        return /^Executing/.test(line);
      });
      assert.deepEqual(executingNotifications, [
          'Executing noActionNoPrereqs'
        ]);
      next();
    });
  }
};

module.exports = tests;

