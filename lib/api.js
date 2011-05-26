var api = new (function () {
  this.task = function (name, prereqs, handler, async) {
    var args = Array.prototype.slice.call(arguments)
      , type;
    args.unshift('task');
    jake.taskOrFile.apply(global, args);
    jake.currentTaskDescription = null;
  };

  this.file = function (name, prereqs, handler, async) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('file');
    jake.taskOrFile.apply(global, args);
    jake.currentTaskDescription = null;
  };

  this.desc = function (str) {
    jake.currentTaskDescription = str;
  };

  this.namespace = function (name, nextLevelDown) {
    var curr = jake.currentNamespace
      , ns = new jake.Namespace(name, curr);
    curr.childNamespaces[name] = ns;
    jake.currentNamespace = ns;
    nextLevelDown();
    jake.currentNamespace = curr;
    jake.currentTaskDescription = null;
  };

  this.complete = function () {
    jake.runNextTask();
  };

  this.fail = function (err, code) {
    if (code) {
      jake.errorCode = code;
    }
    if (err) {
      if (typeof err == 'string') {
        throw new Error(err);
      }
      else if (err instanceof Error) {
        throw err;
      }
      else {
        throw new Error(err.toString());
      }
    }
    else {
      throw new Error();
    }
  };

})();

module.exports = api;
