### Jake -- JavaScript build tool for Node.js

### Installing

Prerequisites: Jake requires Node.js. (<http://nodejs.org/>)

Get Jake:

    git clone git://github.com/mde/jake.git

Build Jake:

    cd jake && make && sudo make install

### Installing with [npm](http://npmjs.org/)

    npm install jake

Or, get the code, and `npm link` in the code root.

### Installing on Windows

*Assumed: current directory is the same directory where node.exe is present.*

Get Jake:

    git clone git://github.com/mde/jake.git node_modules/jake

Copy jake.bat to the same directory as node.exe

    copy node_modules/jake/jake.bat jake.bat

Add the directory of node.exe to the environment PATH variable.

### Basic usage

    jake [options ...] [env variables ...] target

### Description

    Jake is a simple JavaScript build program with capabilities similar to the regular make or rake command.

    Jake has the following features:
        * Jakefiles are in standard JavaScript syntax
        * Tasks with prerequisites
        * Namespaces for tasks
        * Async task execution

### Options

    -V
    --version                   Display the program version.

    -h
    --help                      Display help information.

    -f *FILE*
    --jakefile *FILE*           Use FILE as the Jakefile.

    -C *DIRECTORY*
    --directory *DIRECTORY*     Change to DIRECTORY before running tasks.

    -T
    --tasks                     Display the tasks, with descriptions, then exit.

### Jakefile syntax

A Jakefile is just executable JavaScript. You can include whatever JavaScript you want in it.

## Tasks

Use `task` to define tasks. Call it with two arguments (and one optional argument):

    task(name, [prerequisites], action, [async]);

The `name` argument is a String with the name of the task, and `prerequisites` is an optional Array arg of the list of prerequisite tasks to perform first. The `action` is a Function defininng the action to take for the task. (Note that Object-literal syntax for name/prerequisites in a single argument a la Rake is also supported, but JavaScript's lack of support for dynamic keys in Object literals makes it not very useful.)

The `async` argument is optional, and when set to `true` (`async === true`) indicates the task executes asynchronously. Asynchronous tasks need to call `complete()` to signal they have completed.

Tasks created with `task` are always executed when asked for (or are a prerequisite). Tasks created with `file` are only executed if no file with the given name exists or if any of its file-prerequisites are more recent than the file named by the task. Also, if any prerequisite is a regular task, the file task will always be executed.


Use `desc` to add a string description of the task.

Here's an example:

    desc('This is the default task.');
    task('default', function (params) {
      console.log('This is the default task.');
    });

    desc('This task has prerequisites.');
    task('hasPrereqs', ['foo', 'bar', 'baz'], function (params) {
      console.log('Ran some prereqs first.');
    });

And here's an example of an asynchronous task:

    desc('This is an asynchronous task.');
    task('asyncTask', function () {
      setTimeout(complete, 1000);
    }, true);

### File-tasks

Create a file-task by calling `file`.

File-tasks create a file from one or more other files. With a file-task, Jake checks both that the file exists, and also that it is not older than the files specified by any prerequisite tasks. File-tasks are particularly useful for compiling something from a tree of source files.

    desc('This builds a minified JS file for production.');
    file('foo-minified.js', ['bar', 'foo-bar.js', 'foo-baz.js'], function () {
      // Code to concat and minify goes here
    });

### Directory-tasks

Create a directory-task by calling `directory`.

Directory-tasks create a directory for use with for file-tasks. Jake checks for the existence of the directory, and only creates it if needed.

    desc('This creates the bar directory for use with the foo-minified.js file-task.');
    directory('bar');

### Namespaces

Use `namespace` to create a namespace of tasks to perform. Call it with two arguments:

    namespace(name, namespaceTasks);

Where is `name` is the name of the namespace, and `namespaceTasks` is a function with calls inside it to `task` or `desc` definining all the tasks for that namespace.

Here's an example:

    desc('This is the default task.');
    task('default', function () {
      console.log('This is the default task.');
    });

    namespace('foo', function () {
      desc('This the foo:bar task');
      task('bar', function () {
        console.log('doing foo:bar task');
      });

      desc('This the foo:baz task');
      task('baz', ['default', 'foo:bar'], function () {
        console.log('doing foo:baz task');
      });

    });

In this example, the foo:baz task depends on the the default and foo:bar tasks.

### Passing parameters to jake

Parameters can be passed to Jake two ways: plain arguments, and environment variables.

To pass positional arguments to the Jake tasks, enclose them in square braces, separated by commas, after the name of the task on the command-line. For example, with the following Jakefile:

    desc('This is an awesome task.');
    task('awesome', function (a, b, c) {
      console.log(a, b, c);
    });

You could run `jake` like this:

    jake awesome[foo,bar,baz]

And you'd get the following output:

    foo bar baz

Note that you *cannot* uses spaces between the commas separating the parameters.

Any parameters passed after the Jake task that contain an equals sign (=) will be added to process.env.

With the following Jakefile:

    desc('This is an awesome task.');
    task('awesome', function (a, b, c) {
      console.log(a, b, c);
      console.log(process.env.qux, process.env.frang);
    });

You could run `jake` like this:

    jake awesome[foo,bar,baz] qux=zoobie frang=asdf

And you'd get the following output:

    foo bar baz
    zoobie asdf
Running `jake` with no arguments runs the default task.

### Running tasks from within other tasks

Jake supports the ability to run a task from within another task via the `invoke` and `execute` methods.

The `invoke` method will run the desired task, along with its prerequisites:

    desc('Calls the foo:bar task and its prerequisites.');
    task('invokeFooBar', function () {
      // Calls foo:bar and its prereqs
      jake.Task['foo:bar'].invoke();
    });

It will only run the task once, even if you call `invoke` repeatedly.

    desc('Calls the foo:bar task and its prerequisites.');
    task('invokeFooBar', function () {
      // Calls foo:bar and its prereqs
      jake.Task['foo:bar'].invoke();
      // Does nothing
      jake.Task['foo:bar'].invoke();
    });

The `execute` method will run the desired task without its prerequisites:

    desc('Calls the foo:bar task without its prerequisites.');
    task('executeFooBar', function () {
      // Calls foo:bar without its prereqs
      jake.Task['foo:baz'].execute();
    });

Calling `execute` repeatedly will run the desired task repeatedly.

    desc('Calls the foo:bar task without its prerequisites.');
    task('executeFooBar', function () {
      // Calls foo:bar without its prereqs
      jake.Task['foo:baz'].execute();
      // Can keep running this over and over
      jake.Task['foo:baz'].execute();
      jake.Task['foo:baz'].execute();
    });

If you want to run the task and its prerequisites more than once, you can use `invoke` with the `re-enable` method.

    desc('Calls the foo:bar task and its prerequisites.');
    task('invokeFooBar', function () {
      // Calls foo:bar and its prereqs
      jake.Task['foo:bar'].invoke();
      // Does nothing
      jake.Task['foo:bar'].invoke();
      // Only re-runs foo:bar, but not its prerequisites
      jake.Task['foo:bar'].re-enable();
      jake.Task['foo:bar'].invoke();
    });

The `re-enable` method takes a single Boolean arg, a 'deep' flag, which reenables the task's prerequisites if set to true.

    desc('Calls the foo:bar task and its prerequisites.');
    task('invokeFooBar', function () {
      // Calls foo:bar and its prereqs
      jake.Task['foo:bar'].invoke();
      // Does nothing
      jake.Task['foo:bar'].invoke();
      // Only re-runs foo:bar, but not its prerequisites
      jake.Task['foo:bar'].re-enable(true);
      jake.Task['foo:bar'].invoke();
    });

It's easy to pass params on to a sub-task run via `invoke` or `execute`:

    desc('Passes params on to other tasks.');
    task('passParams', function () {
      var t = jake.Task['foo:bar'];
      // Calls foo:bar, passing along current args
      t.invoke.apply(t, arguments);
    });

### Aborting a task

You can abort a task by calling the `fail` function, and Jake will abort the currently running task. You can pass a customized error message to `fail`:

    desc('This task fails.');
    task('failTask', function () {
      fail('Yikes. Something back happened.');
    });

You can also pass an optional exit status-code to the fail command, like so:

    desc('This task fails with an exit-status of 42.');
    task('failTaskQuestionCustomStatus', function () {
      fail('What is the answer?', 42);
    });

The process will exit with a status of 42.

Uncaught errors will also abort the currently running task.

### Showing the list of tasks

Passing `jake` the -T or --tasks flag will display the full list of tasks available in a Jakefile, along with their descriptions:

    $ jake -T
    jake default       # This is the default task.
    jake asdf          # This is the asdf task.
    jake concat.txt    # File task, concating two files together
    jake failure       # Failing task.
    jake lookup        # Jake task lookup by name.
    jake foo:bar       # This the foo:bar task
    jake foo:fonebone  # This the foo:fonebone task

Setting a value for -T/--tasks will filter the list by that value:

    $ jake -T foo
    jake foo:bar       # This the foo:bar task
    jake foo:fonebone  # This the foo:fonebone task

The list displayed will be all tasks whose namespace/name contain the filter-string.

### PackageTask

Jake's PackageTask programmically creates a set of tasks for packaging up your project for distribution. Here's an example:

    var t = new jake.PackageTask('fonebone', 'v0.1.2112', function () {
      var fileList = [
        'Jakefile'
      , 'README.md'
      , 'package.json'
      , 'lib/*'
      , 'bin/*'
      , 'tests/*'
      ];
      this.packageFiles.include(fileList);
      this.needTarGz = true;
      this.needTarBz2 = true;
    });

This will automatically create a 'package' task that will assemble the specified files in 'pkg/fonebone-v0.1.2112,' and compress them according to the specified options. After running `jake package`, you'll have the following in pkg/:

    fonebone-v0.1.2112
    fonebone-v0.1.2112.tar.bz2
    fonebone-v0.1.2112.tar.gz

PackageTask also creates a 'clobberPackage' task that removes the pkg/ directory, and a 'repackage' task that forces the package to be rebuilt.

PackageTask requires NodeJS's glob module (https://github.com/isaacs/node-glob). It is used in FileList, which is used to specify the list of files to include in your PackageTask (the packageFiles property). (See FileList, below.)

### FileList

Jake's FileList takes a list of glob-patterns and file-names, and lazy-creates a list of files to include. Instead of immediately searching the filesystem to find the files, a FileList holds the pattern until it is actually used.

When any of the normal JavaScript Array methods (or the `toArray` method) are called on the FileList, the pending patterns are resolved into an actual list of file-names. FileList uses NodeJS's glob module (https://github.com/isaacs/node-glob).

To build the list of files, use FileList's `include` and `exclude` methods:

    var list = new jake.FileList();
    list.include('foo/*.txt');
    list.include(['bar/*.txt', 'README.md']);
    list.include('Makefile', 'package.json');
    list.exclude('foo/zoobie.txt');
    list.exclude(/foo\/src.*.txt/);
    console.log(list.toArray());

The `include` method can be called either with an array of items, or multiple single parameters. Items can be either glob-patterns, or individual file-names.

The `exclude` method will prevent files from being included in the list. These files must resolve to actual files on the filesystem. It can be called either with an array of items, or mutliple single parameters. Items can be glob-patterns, individual file-names, string-representations of regular-expressions, or regular-expression literals.

### CoffeeScript Jakefiles

Jake can also handle Jakefiles in CoffeeScript. Be sure to make it Jakefile.coffee so Jake knows it's in CoffeeScript.

Here's an example:

    sys = require('sys')

    desc 'This is the default task.'
    task 'default', (params) ->
      console.log 'Ths is the default task.'
      console.log(sys.inspect(arguments))
      invoke 'new', []

    task 'new', ->
      console.log 'ello from new'
      invoke 'foo:next', ['param']

    namespace 'foo', ->
      task 'next', (param) ->
        console.log 'ello from next with param: ' + param

### Related projects

James Coglan's "Jake": <http://github.com/jcoglan/jake>

Confusingly, this is a Ruby tool for building JavaScript packages from source code.

280 North's Jake: <http://github.com/280north/jake>

This is also a JavaScript port of Rake, which runs on the Narwhal platform.

### Author

Matthew Eernisse, mde@fleegix.org

### Contributors

Mark Wubben / EqualMedia <mark.wubben@equalmedia.com>
Patrick Walton <pcwalton@mimiga.net>
Andrzej Sliwa <andrzej.sliwa@i-tool.eu>
Nikolay V. Nemshilov aka St <nemshilov@gmail.com>
Sascha Teske <sascha.teske@gmail.com>

### License

Licensed under the Apache License, Version 2.0 (<http://www.apache.org/licenses/LICENSE-2.0>)
