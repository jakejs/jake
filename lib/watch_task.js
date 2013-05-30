
var WatchTask = function (names, options) {
  var taskNames = Array.isArray(names) ? names : [names]
    , opts = options || {}
    , t = task('watchTasks', taskNames);
  task('watch', function () {
    jake.watch('./', {pattern: opts.pattern}, function () {
      t.invoke();
    });
  });
};

exports.WatchTask = WatchTask;

