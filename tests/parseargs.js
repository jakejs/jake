var parseargs = require('../lib/parseargs')
  , assert = require('assert')
  , optsReg = [
      { full: 'directory'
      , abbr: 'C'
      , preempts: false
      , expectValue: true
      }
    , { full: 'jakefile'
      , abbr: 'f'
      , preempts: false
      , expectValue: true
      }
    , { full: 'tasks'
      , abbr: 'T'
      , preempts: true
      }
    , { full: 'trace'
      , abbr: 't'
      , preempts: false
      , expectValue: false
      }
    , { full: 'help'
      , abbr: 'h'
      , preempts: true
      }
    , { full: 'version'
      , abbr: 'V'
      , preempts: true
      }
    ]
  , p = new parseargs.Parser(optsReg)
  , z = function (s) { return s.split(' '); }
  , res;

// Long preemptive opt and val with equal-sign, ignore further opts
res = p.parse(z('--tasks=foo --jakefile=asdf'));
assert.equal('foo', res.opts.tasks);
assert.equal(undefined, res.opts.jakefile);

// Long preemptive opt and val without equal-sign, ignore further opts
res = p.parse(z('--tasks foo --jakefile=asdf'));
assert.equal('foo', res.opts.tasks);
assert.equal(undefined, res.opts.jakefile);

// Long preemptive opt and no val, ignore further opts
res = p.parse(z('--tasks --jakefile=asdf'));
assert.equal(true, res.opts.tasks);
assert.equal(undefined, res.opts.jakefile);

// Preemptive opt with no val, should be true
res = p.parse(z('-T'));
assert.equal(true, res.opts.tasks);

// Preemptive opt with no val, should be true and ignore further opts
res = p.parse(z('-T -f'));
assert.equal(true, res.opts.tasks);
assert.equal(undefined, res.opts.jakefile);

// Preemptive opt with val, should be val
res = p.parse(z('-T zoobie -f foo/bar/baz'));
assert.equal('zoobie', res.opts.tasks);
assert.equal(undefined, res.opts.jakefile);

// -f expects a value, -t does not (howdy is task-name)
res = p.parse(z('-f zoobie -t howdy'));
assert.equal('zoobie', res.opts.jakefile);
assert.equal(true, res.opts.trace);
assert.equal('howdy', res.taskNames[0]);

// Different order, -f expects a value, -t does not (howdy is task-name)
res = p.parse(z('-f zoobie howdy -t'));
assert.equal('zoobie', res.opts.jakefile);
assert.equal(true, res.opts.trace);
assert.equal('howdy', res.taskNames[0]);

// -f expects a value, -t does not (foo=bar is env var)
res = p.parse(z('-f zoobie -t foo=bar'));
assert.equal('zoobie', res.opts.jakefile);
assert.equal(true, res.opts.trace);
assert.equal('bar', res.envVars.foo);
assert.equal(undefined, res.taskName);

// -f expects a value, -t does not (foo=bar is env-var, task-name follows)
res = p.parse(z('-f zoobie -t howdy foo=bar'));
assert.equal('zoobie', res.opts.jakefile);
assert.equal(true, res.opts.trace);
assert.equal('bar', res.envVars.foo);
assert.equal('howdy', res.taskNames[0]);

// -t does not expect a value, -f does (throw howdy away)
res = p.parse(z('-t howdy -f zoobie'));
assert.equal(true, res.opts.trace);
assert.equal('zoobie', res.opts.jakefile);
assert.equal(undefined, res.taskName);

// --trace does not expect a value, -f does (throw howdy away)
res = p.parse(z('--trace howdy --jakefile zoobie'));
assert.equal(true, res.opts.trace);
assert.equal('zoobie', res.opts.jakefile);
assert.equal(undefined, res.taskName);

// --trace does not expect a value, -f does (throw howdy away)
res = p.parse(z('--trace=howdy --jakefile=zoobie'));
assert.equal(true, res.opts.trace);
assert.equal('zoobie', res.opts.jakefile);
assert.equal(undefined, res.taskName);

/*
// Task-name with positional args
res = p.parse(z('foo:bar[asdf,qwer]'));
assert.equal('asdf', p.taskArgs[0]);
assert.equal('qwer', p.taskArgs[1]);

// Opts, env vars, task-name with positional args
res = p.parse(z('-f ./tests/Jakefile -t default[asdf,qwer] foo=bar'));
assert.equal('./tests/Jakefile', res.opts.jakefile);
assert.equal(true, res.opts.trace);
assert.equal('bar', res.envVars.foo);
assert.equal('default', res.taskName);
assert.equal('asdf', p.taskArgs[0]);
assert.equal('qwer', p.taskArgs[1]);
*/

