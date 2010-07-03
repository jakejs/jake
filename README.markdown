### Jake -- JavaScript Make

### Basic usage

    jake [-f Jakefile] [-C directory] [--version] target (commands/options ...)

### Description

    Jake is a simple JavaScript build program with capabilities similar to the regular make or rake command.

    Jake has the following features:
        * Jakefiles are in standard JavaScript syntax
        * Tasks with prerequisites
        * Namespaces for tasks

### Options

    --version                   Display the program version.

    -f *FILE*
    --jakefile *FILE*           Use FILE as the Jakefile.

    -C *DIRECTORY*
    --directory *DIRECTORY*     Change to DIRECTORY before running tasks.

    -T
    --tasks                     Display the tasks, with descriptions, then exit.

### Jakefile syntax


Use `task` to define tasks. Call it with three arguments:

    task(name, dependencies, handler);

Where `name` is the string name of the task, `dependencies` is an array of the dependencies, and `handler` is a function to run for the task.

Use `desc` to add a string description of the task.

Here's an example:

    var sys = require('sys');

    desc('This is the default task.');
    task('default', [], function (params) {
      sys.puts('This is the default task.');
      sys.puts(sys.inspect(params));
    });

Use `namespace` to create a namespace of tasks to perform. Call it with two arguments:

  namespace(name, namespaceTasks);

Where is `name` is the name of the namespace, and `namespaceTasks` is a function with calls inside it to `task` or `desc` definining all the tasks for that namespace.

Here's an example:

    var sys = require('sys');

    desc('This is the default task.');
    task('default', [], function (params) {
      sys.puts('This is the default task.');
      sys.puts(sys.inspect(params));
    });

    namespace('foo', function () {
      desc('This the foo:bar task');
      task('bar', [], function () {
        sys.puts('doing foo:bar task');
        sys.puts(sys.inspect(params));
      });

      desc('This the foo:baz task');
      task('baz', ['default', 'foo:bar'], function () {
        sys.puts('doing foo:baz task');
        sys.puts(sys.inspect(params));
      });

    });

In this example, the foo:baz task depends on both the default and the foo:bar task.

Running `jake` with no arguments runs the default task.


