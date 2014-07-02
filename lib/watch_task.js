var fs = require('fs')
  , FileList = require('./file_list').FileList;

var WatchTask = function (taskNames, definition) {
  var THROTTLE = 5000;

  var self = this
    , last = (new Date()).getTime() - THROTTLE;

  this.watchTasks = Array.isArray(taskNames) ? taskNames : [taskNames];
  this.watchFiles = new FileList();
  this.rootTask = task('watchTasks', this.watchTasks);
  this.throttle = THROTTLE;

  this.watchFiles.include(WatchTask.DEFAULT_INCLUDE_FILES);
  this.watchFiles.exclude(WatchTask.DEFAULT_EXCLUDE_FILES);

  if (typeof definition == 'function') {
    definition.call(this);
  }

  desc('Runs these tasks: ' + this.watchTasks.join(', '));
  task('watch', function () {
    console.log('WatchTask started for: ' + self.watchTasks.join(', '));
    jake.watch('.', {includePattern: /.+/}, function (filePath) {
      var fileMatch = self.watchFiles.toArray().some(function (item) {
        return item == filePath;
      });
      if (fileMatch && ((new Date()).getTime() - last) > self.throttle) {
        last = (new Date()).getTime();
        self.rootTask.reenable(true);
        self.rootTask.invoke();
      }
    });
  });
};

WatchTask.DEFAULT_INCLUDE_FILES = [
  './**/*.js'
, './**/*.coffee'
, './**/*.css'
, './**/*.less'
, './**/*.scss'
];

WatchTask.DEFAULT_EXCLUDE_FILES = [];
if (fs.existsSync('node_modules')) {
  WatchTask.DEFAULT_EXCLUDE_FILES.push('node_modules/**');
}
if (fs.existsSync('.git')) {
  WatchTask.DEFAULT_EXCLUDE_FILES.push('.git/**');
}

exports.WatchTask = WatchTask;

