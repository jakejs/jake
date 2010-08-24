### Node-Jake -- JavaScript build tool for Node.js

### Installing

Prerequisites: Node-Jake requires Node.js. (<http://nodejs.org/>)

Get Node-Jake:

    git clone git://github.com/mde/node-jake.git

Build Node-Jake:

    cd node-jake && make && sudo make install

### Installing with [npm](http://npmjs.org/)

    npm install jake

Or, get the code, and `npm link` in the code root.

### Basic usage

    jake [options] target (commands/options ...)

### Description

    Jake is a simple JavaScript build program with capabilities similar to the regular make or rake command.

    Jake has the following features:
        * Jakefiles are in standard JavaScript syntax
        * Tasks with prerequisites
        * Namespaces for tasks

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


Use `task` to define tasks. Call it with three arguments (and one more optional argument):

    task(name, dependencies, handler, [async]);

Where `name` is the string name of the task, `dependencies` is an array of the dependencies, and `handler` is a function to run for the task.

The `async` argument is optional, and when set to `true` (`async === true`) indicates the task executes asynchronously. Asynchronous tasks need to call `complete()` to signal they have completed.


Use `desc` to add a string description of the task.

Here's an example:

    var sys = require('sys');

    desc('This is the default task.');
    task('default', [], function (params) {
      sys.puts('This is the default task.');
      sys.puts(sys.inspect(arguments));
    });

And here's an example of an asynchronous task:

    desc('This is an asynchronous task.');
    task('asynchronous', [], function () {
      setTimeout(complete, 1000);
    }, true);

Use `namespace` to create a namespace of tasks to perform. Call it with two arguments:

    namespace(name, namespaceTasks);

Where is `name` is the name of the namespace, and `namespaceTasks` is a function with calls inside it to `task` or `desc` definining all the tasks for that namespace.

Here's an example:

    var sys = require('sys');

    desc('This is the default task.');
    task('default', [], function () {
      sys.puts('This is the default task.');
      sys.puts(sys.inspect(arguments));
    });

    namespace('foo', function () {
      desc('This the foo:bar task');
      task('bar', [], function () {
        sys.puts('doing foo:bar task');
        sys.puts(sys.inspect(arguments));
      });

      desc('This the foo:baz task');
      task('baz', ['default', 'foo:bar'], function () {
        sys.puts('doing foo:baz task');
        sys.puts(sys.inspect(arguments));
      });

    });

In this example, the foo:baz task depends on both the default and the foo:bar task.

### Passing parameters to jake

Two kinds of parameters can be passed to Node-Jake: positional and named parameters.

Any single parameters passed to the jake command after the task name are passed along to the task handler as positional arguments. For example, with the following Jakefile:

    var sys = require('sys');

    desc('This is an awesome task.');
    task('awesome', [], function () {
      sys.puts(sys.inspect(Array.prototype.slice.call(arguments)));
    });

You could run `jake` like this:

    jake awesome foo bar baz

And you'd get the following output:

    [ 'foo', 'bar', 'baz' ]

Any paramters passed to the jake command that contain a colon (:) or equals sign (=) will be added to a keyword/value object that is passed as a final argument to the task handler.

With the above Jakefile, you could run `jake` like this:

    jake awesome foo bar baz qux:zoobie frang:asdf

And you'd get the following output:

    [ 'foo'
    , 'bar'
    , 'baz'
    , { qux: 'zoobie', frang: 'asdf' }
    ]

Running `jake` with no arguments runs the default task.

### Related projects

James Coglan's "Jake": <http://github.com/jcoglan/jake>

Confusingly, this is a Ruby tool for building JavaScript packages from source code.

280 North's Jake: <http://github.com/280north/jake>

This is also a JavaScript port of Rake, which runs on the Narwhal platform.

### Author

Matthew Eernisse, mde@fleegix.org

### Contributors

Mark Wubben / EqualMedia, mark.wubben@equalmedia.com

