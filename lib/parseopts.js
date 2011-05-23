var parseopts = {};

/**
 * @constructor
 * Parses a list of command-line args into a key/value object of
 * options and an array of positional commands.
 * @ param {Array} opts A list of options in the following format:
 * [{full: 'foo', abbr: 'f'}, {full: 'bar', abbr: 'b'}]]
 */
parseopts.Parser = function (opts) {
  // Positional commands parse out of the args
  this.cmds = [];
  // A key/value object of matching options parsed out of the args
  this.opts = {};

  // Data structures used for parsing
  this.reg = [];
  this.shortOpts = {};
  this.longOpts = {};

  var item;
  for (var i = 0, ii = opts.length; i < ii; i++) {
    item = opts[i];
    this.shortOpts[item.abbr] = item.full;
    this.longOpts[item.full] = item.full;
  }
  this.reg = opts;
};

parseopts.Parser.prototype = new function () {

  /**
   * Parses an array of arguments into options and positional commands
   * Any matcthing opts end up in a key/value object keyed by the 'full'
   * name of the option. Any args that aren't passed as options end up in
   * an array of positional commands.
   * Any options passed without a value end up with a value of null
   * in the key/value object of options
   * If the user passes options that are not defined in the list passed
   * to the constructor, the parser throws an error 'Unknown option.'
   * @param {Array} args The command-line args to parse
   */
  this.parse = function (args) {
    var cmds = []
      , opts = {}
      , arg
      , argName
      , argItems;

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = this.longOpts[argItems[0].substr(2)];
        if (argName) {
          // If there's no attached value, value is null
          opts[argName] = argItems[1] || true;
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = this.shortOpts[arg.substr(1)];
        if (argName) {
          // If there is no following item, or the next item is
          // another opt, value is null
          opts[argName] = (!args[0] || (args[0].indexOf('-') == 0)) ?
              true : args.shift();
        }
        else {
          throw new Error('Unknown option "' + arg + '"');
        }
      }
      else {
        cmds.push(arg);
      }
    }

    this.cmds = cmds;
    this.opts = opts;
  };

};

module.exports = parseopts;
