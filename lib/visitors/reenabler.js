
var Reenabler = new (function () {
  var reenablePrereqs = function (task) {
    var prereqs = task.prereqs
      , prereq;
    if (prereqs && prereqs.length) {
      for (var i = 0, ii = prereqs.length; i < ii; i++) {
        prereq = jake.Task[prereqs[i]];
        if (prereq) {
          prereq.done = false;
          reenablePrereqs(prereq);
        }
      }
    }
  };

  this.visit = function (task) {
    reenablePrereqs(task);
  };

})();

exports.Reenabler = Reenabler;
