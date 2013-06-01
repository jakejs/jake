FileList = require('./file_list').FileList;

var WatchTask = function (taskNames, definition) {
  var self = this;

  this.watchTasks = Array.isArray(taskNames) ? taskNames : [taskNames];
  this.watchFiles = new FileList();
  this.rootTask = task('watchTasks', this.watchTasks);

  this.watchFiles.include(WatchTask.DEFAULT_FILES);
  this.watchFiles.exclude(WatchTask.DEFAULT_EXCLUSIONS);

  if (typeof definition == 'function') {
    definition.call(this);
  }

  task('watch', function () {
    jake.watch('./', self.watchFiles.toArray(), function () {
      self.rootTask.invoke();
    });
  });
};

WatchTask.DEFAULT_FILES = [
  './**/*.js'
, './**/*.coffee'
, './**/*.css'
, './**/*.less'
, './**/*.scss'
];

WatchTask.DEFAULT_EXCLUSIONS = [
  'node_modules/**'
];

exports.WatchTask = WatchTask;

