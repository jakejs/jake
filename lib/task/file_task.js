var fs = require('fs');
   var Task = require('./task').Task;
   var FileTask;
   var FileBase;
   var DirectoryTask;
   var utils = require('../utils');

FileBase = new (function () {
  var isFileOrDirectory = function (t) {
        return (t instanceof FileTask ||
            t instanceof DirectoryTask);
      };
     var isFile = function (t) {
        return (t instanceof FileTask && !(t instanceof DirectoryTask));
      };

  this.isNeeded = function () {
    //console.log('isNeeded file');
    var prereqs = this.prereqs;
    var prereqName;
    var prereqTask;

    //console.log('isNeeded prereqs', this.name, prereqs && prereqs.length);

    // No repeatsies
    if (this.taskStatus === Task.runStatuses.DONE) {
      return false;
    }
    // The always-make override
    else if (jake.program.opts['always-make']) {
      // Run if there actually is an action
      if (typeof this.action == 'function') {
        return true;
      }
      else {
        this.taskStatus = Task.runStatuses.DONE;
        return false;
      }
    }
    // Default case
    else {
      // We need either an existing file, or an action to create one.
      // First try grabbing the actual mod-time of the file
      try {
        //console.log('calling updateModTime', this.name);
        this.updateModTime();
        //console.log('this.modTime', this.modTime);
      }
      // Then fall back to looking for an action
      catch(e) {
        //console.log('Caught error', e.message);
        if (typeof this.action == 'function') {
          return true;
        }
        else {
          throw new Error('File-task ' + this.fullName + ' has no ' +
            'existing file, and no action to create one.');
        }
      }

      //console.log('GOT HERE prereqs', this.name, prereqs && prereqs.length);

      // Compare mod-time of all the prereqs with its mod-time
      // If any prereqs are newer, need to run the action to update
      if (prereqs && prereqs.length) {
        for (var i = 0, ii = prereqs.length; i < ii; i++) {
          prereqName = prereqs[i];
          prereqTask = this.namespace.resolveTask(prereqName) ||
            jake.createPlaceholderFileTask(prereqName, this.namespace);
          // Run the action if:
          // 1. The prereq is a normal task (not file/dir)
          // 2. The prereq is a file-task with a mod-date more recent than
          // the one for this file/dir
          //console.log('prereqTask', prereqTask.name, prereqTask.modTime, isFileOrDirectory(prereqTask));
          if (prereqTask) {
            //console.log('GOT HERE >>>>>>', this.modTime, prereqTask.modTime);
            if (!isFileOrDirectory(prereqTask) ||
                (isFile(prereqTask) && prereqTask.modTime > this.modTime)) {
              return true;
            }
          }
        }
      }
      // File/dir has no prereqs, and exists -- no need to run
      else {
        //console.log('is not needed');
        this.taskStatus = Task.runStatuses.DONE;
        return false;
      }
    }
  };

  this.updateModTime = function () {
    //console.log('running updateModTime', this.name);
    var stats = fs.statSync(this.name);
    this.modTime = stats.mtime;
  };

  this.complete = function () {
    jake._invocationChain.splice(jake._invocationChain.indexOf(this), 1);
    if (!this.dummy) {
      this.updateModTime();
    }
    this._currentPrereqIndex = 0;
    this.taskStatus = Task.runStatuses.DONE;
    this.emit('complete');
  };

})();

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.FileTask
  @constructor
  @augments EventEmitter
  @augments jake.Task
  @description A Jake FileTask

  @param {String} name The name of the Task
  @param {Array} [prereqs] Prerequisites to be run before this task
  @param {Function} [action] The action to perform to create this file
  @param {Object} [opts]
    @param {Array} [opts.asyc=false] Perform this task asynchronously.
    If you flag a task with this option, you must call the global
    `complete` method inside the task's action, for execution to proceed
    to the next task.
 */
FileTask = function (name, prereqs, action, opts) {
  this.dummy = false;

  // Do constructor-work only on actual instances, not when used
  // for inheritance
  if (arguments.length) {
    this.init.apply(this, arguments);
  }

  if (fs.existsSync(this.name)) {
    this.updateModTime();
  }
  else {
    this.modTime = Number.POSITIVE_INFINITY;
  }

};
FileTask.prototype = new Task();
FileTask.prototype.constructor = FileTask;
utils.mixin(FileTask.prototype, FileBase);

exports.FileTask = FileTask;

// DirectoryTask is a subclass of FileTask, depends on it
// being defined
DirectoryTask = require('./directory_task').DirectoryTask;

