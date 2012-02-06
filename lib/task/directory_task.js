var DirectoryTask
  , FileTask = require('./file_task').FileTask;

DirectoryTask = function (name, prereqs, action, opts) {
  this.modTime = null;
  // Do constructor-work only on actual instances, not when used
  // for inheritance
  if (arguments.length) {
    this.constructor.prototype.init.apply(this, arguments);
  }
};
DirectoryTask.prototype = new FileTask();
DirectoryTask.prototype.constructor = DirectoryTask;

exports.DirectoryTask = DirectoryTask;
