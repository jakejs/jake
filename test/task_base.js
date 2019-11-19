var assert = require('assert');
var h = require('./helpers');
var utils = require('utilities');

var tests = {

  'before': function () {
    process.chdir('./test');
  },

  'after': function () {
    process.chdir('../');
  },

  'test default task': function (next) {
    h.exec('../bin/cli.js -q', function (out) {
      assert.equal('default task', out);
      h.exec('../bin/cli.js -q default', function (out) {
        assert.equal('default task', out);
        next();
      });
    });
  },

  'test task with no action': function (next) {
    h.exec('../bin/cli.js -q noAction', function (out) {
      assert.equal('default task', out);
      next();
    });
  },

  'test a task with no action and no prereqs': function (next) {
    h.exec('../bin/cli.js noActionNoPrereqs', function () {
      next();
    });
  },

  'test passing args to a task': function (next) {
    h.exec('../bin/cli.js -q argsEnvVars[foo,bar]', function (out) {
      var parsed = h.parse(out);
      var args = parsed.args;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
      next();
    });
  },

  'test a task with environment vars': function (next) {
    h.exec('../bin/cli.js -q argsEnvVars foo=bar baz=qux', function (out) {
      var parsed = h.parse(out);
      var env = parsed.env;
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
      next();
    });
  },

  'test passing args and using environment vars': function (next) {
    h.exec('../bin/cli.js -q argsEnvVars[foo,bar] foo=bar baz=qux', function (out) {
      var parsed = h.parse(out);
      var args = parsed.args;
      var env = parsed.env;
      assert.equal(args[0], 'foo');
      assert.equal(args[1], 'bar');
      assert.equal(env.foo, 'bar');
      assert.equal(env.baz, 'qux');
      next();
    });
  },

  'test single auto completion': function (next) {
    var args = ['-f', './auto_complete_test_jakefile', 'd'];
    var opts = _getAutoCompleteOpts(args);
    h.exec('../bin/auto_complete.js '+_getAutoCompleteExecArgs(args), opts, function (out) {
      assert.equal('no-space default', out);
      next();
    });
  },

  'test multiple auto completion': function (next) {
    var args = ['-f', './auto_complete_test_jakefile', 'foo:ba'];
    var opts = _getAutoCompleteOpts(args);
    h.exec('../bin/auto_complete.js '+_getAutoCompleteExecArgs(args), opts, function (out) {
      assert.equal('yes-space foo:bar foo:baz', out);
      next();
    });
  },

  'test file argument auto completion': function (next) {
    var args = ['-f'];
    var opts = _getAutoCompleteOpts(args);
    h.exec('../bin/auto_complete.js '+_getAutoCompleteExecArgs(args), opts, function (out) {
      assert.equal('no-complete', out);
      next();
    });
  },

  'test no completions auto completion': function (next) {
    var args = ['-f', './auto_complete_test_jakefile', 'no-such-completion'];
    var opts = _getAutoCompleteOpts(args);
    h.exec('../bin/auto_complete.js '+_getAutoCompleteExecArgs(args), opts, function (out) {
      assert.equal('no-space', out);
      next();
    });
  },

  'test a simple prereq': function (next) {
    h.exec('../bin/cli.js -q foo:baz', function (out) {
      assert.equal('foo:bar task\nfoo:baz task', out);
      next();
    });
  },

  'test a duplicate prereq only runs once': function (next) {
    h.exec('../bin/cli.js -q foo:asdf', function (out) {
      assert.equal('foo:bar task\nfoo:baz task\nfoo:asdf task', out);
      next();
    });
  },

  'test a prereq with command-line args': function (next) {
    h.exec('../bin/cli.js -q foo:qux', function (out) {
      assert.equal('foo:bar[asdf,qwer] task\nfoo:qux task', out);
      next();
    });
  },

  'test a prereq with args via invoke': function (next) {
    h.exec('../bin/cli.js -q foo:frang[zxcv,uiop]', function (out) {
      assert.equal('foo:bar[zxcv,uiop] task\nfoo:frang task', out);
      next();
    });
  },

  'test a prereq with args via execute': function (next) {
    h.exec('../bin/cli.js -q foo:zerb[zxcv,uiop]', function (out) {
      assert.equal('foo:bar[zxcv,uiop] task\nfoo:zerb task', out);
      next();
    });
  },

  'test prereq execution-order': function (next) {
    h.exec('../bin/cli.js -q hoge:fuga', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task', out);
      next();
    });
  },

  'test basic async task': function (next) {
    h.exec('../bin/cli.js -q bar:bar', function (out) {
      assert.equal('bar:foo task\nbar:bar task', out);
      next();
    });
  },

  'test promise async task': function (next) {
    h.exec('node ../bin/cli.js -q bar:dependOnpromise', function (out) {
      assert.equal('bar:promise task\nbar:dependOnpromise task saw value 123654', out);
      next();
    });
  },

  'test failing promise async task': function (next) {
    h.exec('node ../bin/cli.js -q bar:brokenPromise', {breakOnError:false}, function (out) {
      assert.equal(1, out.code);
      next();
    });
  },

  'test that current-prereq index gets reset': function (next) {
    h.exec('../bin/cli.js -q hoge:kira', function (out) {
      assert.equal('hoge:hoge task\nhoge:piyo task\nhoge:fuga task\n' +
          'hoge:charan task\nhoge:gero task\nhoge:kira task', out);
      next();
    });
  },

  'test modifying a task by adding prereq during execution': function (next) {
    h.exec('../bin/cli.js -q voom', function (out) {
      assert.equal(2, out);
      next();
    });
  },

  'test listening for task error-event': function (next) {
    h.exec('../bin/cli.js -q vronk:groo', function (out) {
      assert.equal('OMFGZONG', out);
      next();
    });
  },

  'test listening for jake error-event': function (next) {
    h.exec('../bin/cli.js -q throwy', function (out) {
      assert.equal(out, 'Emitted: Error: I am bad');
      next();
    });
  },

  'test large number of same prereqs': function (next) {
    h.exec('../bin/cli.js -q large:same', function (out) {
      assert.equal(out, 'large:leaf\nlarge:same');
      next();
    });
  },

  'test large number of different prereqs': function (next) {
    h.exec('../bin/cli.js -q large:different', function (out) {
      assert.equal(out, 'leaf-12\nleaf-123\nlarge:different');
      next();
    });
  },
};

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
  var nArgs = args.length;
  return args[nArgs - 1]+' '+(nArgs > 1 ? args[nArgs - 2] : '');
}


module.exports = tests;

