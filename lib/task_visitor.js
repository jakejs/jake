
var TaskVisitor = new (function () {

  // Parse any positional args attached to the task-name
  var parsePrereqName = function (name) {
        var taskArr = name.split('[')
          , taskName = taskArr[0]
          , taskArgs = [];
        if (taskArr[1]) {
          taskArgs = taskArr[1].replace(/\]$/, '');
          taskArgs = taskArgs.split(',');
        }
        return {
          name: taskName
        , args: taskArgs
        };
      };

  this.visit = function (task) {
    if (task.prereqs && task.prereqs.length) {
      this.visitNextPrereq.call(this, task);
    }
    else {
      task.run();
    }
  };

  this.visitNextPrereq = function (task) {
    var self = this
      , index = task._currentPrereqIndex
      , name = task.prereqs[index]
      , prereq
      , parsed
      , filePath
      , stats;
    if (name) {
      parsed = parsePrereqName(name);
      prereq = jake.getTask(parsed.name);

      // Task doesn't exist, assume static file -- create a
      // dummy FileTask if file actually exists
      if (!prereq) {
        filePath = name.split(':')[1] || name;
        try {
          stats = fs.statSync(filePath);
          prereq = new jake.FileTask(name);
          prereq.modTime = stats.mtime;
        }
        catch(e) {
          throw new Error('Prerequisite file ' + name + ' does not exist');
        }
      }

      // Do when done
      prereq.addListener('complete', function () {
        task.handlePrereqComplete(prereq);
      });
      prereq.invoke.apply(prereq, parsed.args);
    }
  };

})();

exports.TaskVisitor = TaskVisitor;
