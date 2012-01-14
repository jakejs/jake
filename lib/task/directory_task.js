var DirectoryTask
  , FileTask = require('./file_task').FileTask;

DirectoryTask = function (name, prereqs, action, opts) {
  this.modTime = null;
  this.constructor.prototype.initialize.apply(this, arguments);
};
DirectoryTask.prototype = new FileTask();
DirectoryTask.prototype.constructor = DirectoryTask;

exports.DirectoryTask = DirectoryTask;
