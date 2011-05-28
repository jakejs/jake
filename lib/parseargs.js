var parseargs = {};

/**
 * @constructor
 * Parses a list of command-line args into a key/value object of
 * options and an array of positional commands.
 * @ param {Array} opts A list of options in the following format:
 * [{full: 'foo', abbr: 'f'}, {full: 'bar', abbr: 'b'}]]
 */
parseargs.Parser = function (opts) {
  // A key/value object of matching options parsed out of the args
  this.opts = {};
  this.taskName = null;
  this.taskArgs = null;
  this.envVars = null;

  // Data structures used for parsing
  this.reg = [];
  this.shortOpts = {};
  this.longOpts = {};

  var item;
  for (var i = 0, ii = opts.length; i < ii; i++) {
    item = opts[i];
    this.shortOpts[item.abbr] = item;
    this.longOpts[item.full] = item;
  }
  this.reg = opts;
};

parseargs.Parser.prototype = new function () {

  var _trueOrNextVal = function (argParts, args) {
        if (argParts[1]) {
          return argParts[1];
        }
        else {
          return (!args[0] || (args[0].indexOf('-') == 0)) ?
              true : args.shift();
        }
      };

  /**
   * Parses an array of arguments into options and positional commands
   * @param {Array} args The command-line args to parse
   */
  this.parse = function (args) {
    var cmds = []
      , cmd
      , envVars = {}
      , opts = {}
      , arg
      , argItem
      , argParts
      , cmdItems
      , taskArr
      , taskName
      , taskArgs
      , preempt;

    while (args.length) {
      arg = args.shift();

      if (arg.indexOf('-') == 0) {
        arg = arg.replace(/^--/, '').replace(/^-/, '');
        argParts = arg.split('=');
        argItem = this.longOpts[argParts[0]] || this.shortOpts[argParts[0]];
        if (argItem) {
          // First-encountered preemptive opt take precedence -- no further opts
          // or possibility of ambiguity, so just look for a value, or set to
          // true and then bail
          if (argItem.preempts) {
            opts[argItem.full] = _trueOrNextVal(argParts, args);
            preempt = true;
            break;
          }
          // If we find more opts, throw away any previous args that
          // didn't serve as a val
          cmds = [];
          if (argItem.expectValue) {
            opts[argItem.full] = _trueOrNextVal(argParts, args);
            if (!opts[argItem.full]) {
              throw new Error(argItem.full + ' option expects a value.');
            }
          }
          else {
            opts[argItem.full] = true;
          }
        }
      }
      else {
        cmds.push(arg);
      }
    }

    if (!preempt) {
      // Parse out any env-vars and task-name
      while (!!(cmd = cmds.shift())) {
        cmdItems = cmd.split('=');
        if (cmdItems.length > 1) {
          envVars[cmdItems[0]] = cmdItems[1];
        }
        else {
          taskName = cmd;
          break;
        }
      }

      // Parse any positional args attached to the task-name
      if (taskName) {
        taskArr = taskName.split('[');
        taskName = taskArr[0];
        // Parse any task-args
        if (taskArr[1]) {
          taskArgs = taskArr[1].replace(/\]$/, '');
          taskArgs = taskArgs.split(',');
        }
      }
    }

    this.opts = opts
    this.envVars = envVars;
    this.taskName = taskName;
    this.taskArgs = taskArgs;
  };

};

module.exports = parseargs;
