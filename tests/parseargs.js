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
  , z = function (s) { return s.split(' '); };

// Long preemptive opt and val with equal-sign, ignore further opts
p.parse(z('--tasks=foo --jakefile=asdf'));
assert.equal('foo', p.opts.tasks);
assert.equal(undefined, p.opts.jakefile);

// Long preemptive opt and val without equal-sign, ignore further opts
p.parse(z('--tasks foo --jakefile=asdf'));
assert.equal('foo', p.opts.tasks);
assert.equal(undefined, p.opts.jakefile);

// Long preemptive opt and no val, ignore further opts
p.parse(z('--tasks --jakefile=asdf'));
assert.equal(true, p.opts.tasks);
assert.equal(undefined, p.opts.jakefile);

// Preemptive opt with no val, should be true
p.parse(z('-T'));
assert.equal(true, p.opts.tasks);

// Preemptive opt with no val, should be true and ignore further opts
p.parse(z('-T -f'));
assert.equal(true, p.opts.tasks);
assert.equal(undefined, p.opts.jakefile);

// Preemptive opt with val, should be val
p.parse(z('-T zoobie -f foo/bar/baz'));
assert.equal('zoobie', p.opts.tasks);
assert.equal(undefined, p.opts.jakefile);

// -f expects a value, -t does not (howdy is task-name)
p.parse(z('-f zoobie -t howdy'));
assert.equal('zoobie', p.opts.jakefile);
assert.equal(true, p.opts.trace);
assert.equal('howdy', p.taskName);

// -f expects a value, -t does not (foo=bar is env var)
p.parse(z('-f zoobie -t foo=bar'));
assert.equal('zoobie', p.opts.jakefile);
assert.equal(true, p.opts.trace);
assert.equal('bar', p.envVars.foo);
assert.equal(undefined, p.taskName);

// -f expects a value, -t does not (foo=bar is env-var, task-name follows)
p.parse(z('-f zoobie -t howdy foo=bar'));
assert.equal('zoobie', p.opts.jakefile);
assert.equal(true, p.opts.trace);
assert.equal('bar', p.envVars.foo);
assert.equal('howdy', p.taskName);

// -t does not expect a value, -f does (throw howdy away)
p.parse(z('-t howdy -f zoobie'));
assert.equal(true, p.opts.trace);
assert.equal('zoobie', p.opts.jakefile);
assert.equal(undefined, p.taskName);

// --trace does not expect a value, -f does (throw howdy away)
p.parse(z('--trace howdy --jakefile zoobie'));
assert.equal(true, p.opts.trace);
assert.equal('zoobie', p.opts.jakefile);
assert.equal(undefined, p.taskName);

// --trace does not expect a value, -f does (throw howdy away)
p.parse(z('--trace=howdy --jakefile=zoobie'));
assert.equal(true, p.opts.trace);
assert.equal('zoobie', p.opts.jakefile);
assert.equal(undefined, p.taskName);

// Task-name with positional args
p.parse(z('foo:bar[asdf,qwer]'));
assert.equal('asdf', p.taskArgs[0]);
assert.equal('qwer', p.taskArgs[1]);

// Opts, env vars, task-name with positional args
p.parse(z('-f ./tests/Jakefile -t default[asdf,qwer] foo=bar'));
assert.equal('./tests/Jakefile', p.opts.jakefile);
assert.equal(true, p.opts.trace);
assert.equal('bar', p.envVars.foo);
assert.equal('default', p.taskName);
assert.equal('asdf', p.taskArgs[0]);
assert.equal('qwer', p.taskArgs[1]);


