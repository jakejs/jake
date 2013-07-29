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
, '--verbose should trace when oddly defined task starts': function (next) {
    h.exec('../bin/cli.js --verbose noAction', function (out) {
      var lines = out.split('\n');
      var executingNotifications = _.filter(lines, function(line) {
        return /^Executing/.test(line);
      });
      assert.deepEqual(executingNotifications, [
          'Executing default',
          'Executing noAction'
        ]);
      next();
    });
  }
, '--verbose should trace execution times': function (next) {
    h.exec('../bin/cli.js --verbose noAction', function (out) {
      var lines = out.split('\n');

      var runtimeNotifications = _.map(lines, function(line) {
        var match = (/^  ([^ ]+) \d+ms$/).exec(line);
        if (!match)
          return null;
        else
          return match[1];
      });

      runtimeNotifications = _.filter(runtimeNotifications, function(v) {
        return v != null;
      });

      assert.deepEqual(runtimeNotifications, [
          'default', 'noAction'
        ]);
      next();
    });
  }
};

module.exports = tests;

