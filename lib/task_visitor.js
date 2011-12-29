
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
      , parsed;
    if (name) {
      parsed = parsePrereqName(name);
      prereq = jake.getTask(parsed.name);
      if (prereq) {
        // Do when done
        prereq.addListener('complete', function () {
          task.handlePrereqComplete(prereq);
        });
        prereq.invoke.apply(prereq, parsed.args);
      }
    }
  };

})();

exports.TaskVisitor = TaskVisitor;
