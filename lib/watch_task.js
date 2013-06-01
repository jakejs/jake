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
    jake.watch('.', {includePattern: /.+/}, function (filePath) {
      var shouldRun = self.watchFiles.toArray().some(function (item) {
            return item == filePath;
          });
      if (shouldRun) {
        self.rootTask.reenable(true);
        self.rootTask.invoke();
      }
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
, '.git/**'
];

exports.WatchTask = WatchTask;

