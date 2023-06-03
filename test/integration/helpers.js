const { join, normalize } = require("path");
const os = require("os");
const assert = require("assert");
const { existsSync, statSync } = require('fs');
const { exec, execFileSync, spawnSync, execSync } = require("child_process");
const fs = require("fs");

const jakeCliPath = normalize(join(__dirname, '..', '..', 'bin', 'cli.js'));

const helpers = new (function () {
  let _tests;
  let _names = [];
  let _name;
  let _callback;
  const _runner = function () {
    if ((_name = _names.shift())) {
      console.log('Running ' + _name);
      _tests[_name]();
    } else {
      _callback();
    }
  };

  this.exec = function () {
    const args = Array.prototype.slice.call(arguments);
    let arg;
    let cmd = args.shift();
    let opts = {};
    let callback;
    // Optional opts/callback or callback/opts
    while ((arg = args.shift())) {
      if (typeof arg == 'function') {
        callback = arg;
      } else {
        opts = arg;
      }
    }

    cmd += ' --trace';
    const execOpts = 'execOpts' in opts ? opts.execOpts : {};
    exec(cmd, execOpts, function (err, stdout, stderr) {
      const out = helpers.trim(stdout);
      if (err) {
        if (opts.breakOnError === false) {
          return callback(err);
        } else {
          throw err;
        }
      }
      if (stderr) {
        callback(stderr);
      } else {
        callback(out);
      }
    });
  };

  this.jakeCliPath = jakeCliPath;
  this.execJake = function (args, opts = {}) {
    return execSync(`node ${jakeCliPath} ${args}`, opts).toString().trim();
  };
  this.spawnJake = function (args, opts = {}) {
    return spawnSync('node', [ jakeCliPath, ...args ], opts);
  };

  this.trim = function (s) {
    const str = s || '';
    return str.replace(/^\s*|\s*$/g, '');
  };

  this.parse = function (s) {
    let str = s || '';
    str = helpers.trim(str);
    str = str.replace(/'/g, '"');
    return JSON.parse(str);
  };

  this.run = function (tests, callback) {
    _tests = tests;
    _names = Object.keys(tests);
    _callback = callback;
    _runner();
  };

  this.next = function () {
    _runner();
  };

  /** Safely and human-readably checks the octal mode of a file */
  this.assertFileMode = function (filePath, expected, message) {

    // Ensure the target file actually exists, then get the stats.
    const fileStat = statSync(filePath);
    assert.ok(existsSync(filePath));

    // Bitmask and convert the file mode to an octal string.
    const actualOctal = (fileStat.mode & 0o777).toString(8);

    // Convert to octal string if needed.
    // If windows, '666' is always expected.
    const expectedOctal
      = (os.type() !== 'Windows_NT'
        ? (typeof expected === 'number'
          ? expected.toString(8)
          : expected)
        : '666');

    // Actually compare the results.
    assert.strictEqual(actualOctal, expectedOctal, message);

    // Return the file stats for if they're needed later.
    return fileStat;

  };

  /**
   * Triggers the skipping of a given test if the current system is Windows,
   * and the process is not in an elevated state.
   * @param test The test that requires elevation to run.
   */
  this.testRequiresWindowsElevation = function (test) {
    if (os.type() !== 'Windows_NT') {
      // No need to check unless running windows.
      return;
    }
    try {
      execFileSync('net', ['session'], {
        'stdio': 'ignore',
      });
    } catch (error) {
      test.skip(error);
    }
  };


  /**
   * Recursively and forcefully deletes a list of directories, before
   * re-creating them recursively if specified.
   *
   * The input arguments are handled in sequence, where directory creation only
   * occurs after deletion if either a mode number or `true` boolean have been
   * provided earlier in the args. If a false is provided, subsequently
   * specified directories will not be re-created.
   *
   * The deletion and creation are done as separate iterations to avoid any
   * interference between the two actions in case any list items overlap.
   *
   * This function should be used at the end of a test to clean up only if the
   * test is successful. Otherwise, it should be called at the start or in a
   * setup function to ensure dirs are all in the right state.
   * @param items {string|boolean|number}
   *        The list of directories and any config modifiers.
   */
  this.ensureDirs = function (...items) {

    // Remove all the directories first, to avoid messing up creation later.
    for (const item of items) {
      if (typeof item === 'string') {
        fs.rmSync(item, { recursive: true, force: true });
      }
    }

    let create = true;
    let mode   = undefined;
    for (const item of items) {

      switch (typeof item) {

      case 'number': {
        create = true;
        mode = item & 0o777;
        break;
      }

      case 'boolean': {
        create = item;
        mode = undefined;
        break;
      }

      case "string": {
        if (create) {
          fs.mkdirSync(item, {recursive: true, mode: mode});
        }
        break;
      }

      }
    }
  };

})();

module.exports = helpers;
