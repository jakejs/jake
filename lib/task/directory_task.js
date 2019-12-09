let FileTask = require('./file_task').FileTask;

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.DirectoryTask
  @constructor
  @augments EventEmitter
  @augments jake.Task
  @augments jake.FileTask
  @description A Jake DirectoryTask

  @param {String} name The name of the directory to create.
 */
class DirectoryTask extends FileTask {
  constructor(...args) {
    super(...args);
    this.modTime = null;
  }
}

exports.DirectoryTask = DirectoryTask;
