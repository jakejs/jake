loader.js
=========

Read Jakefile
-------------

line 73

task.js
=======


Exec a Jake Task (Tree)
-----------------------

Line 152

Pass the arguments
-------------------
Line 97 and 213


program.js
==========
Each task invoked by the user is set as the preq of
__root__.

Line 222

    task('__root__', taskNames, function () {});

    rootTask = jake.Task['__root__'];
    rootTask.once('complete', function () {
      jake.emit('complete');
    });
    rootTask.invoke();
