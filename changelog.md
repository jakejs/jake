### v10
+ Support for generic exported functions as tasks
+ Experimental `series` function for composing tasks
+ Added task timing, begin/end task output
* Next-tick kickoff/completion of tasks
* Support both sync and async tasks in experimental `series`
* Polling to ensure 100% sequential execution
* Begin updating to ESNext syntax

### v8
+ Concurrent task execution
+ Allow prereqs for PackageTask + PublishTask
+ LiveScript support
+ Custom publish function, not just string command
* Change to whole-number versioning
* Change to ESLint for linting
* Support newer Nodes, dropped support for older
* Fixes for WatchTask
* Numerous community fixes

### v0.7
+ Updated API for include/exclude in PublishTask
+ beforeEach/afterEach for TaskTask
+ Custom publishing command for PublishTask
+ Tests for PublishTask
+ Throttling for WatchTask
* FileList fixes for Windows
* Fixed output for stdout/stderr when piped
* Numerous fixes for TestTask
* NpmPublish task renamed to simply PublishTask
* Chalk for color output (compat with strict mode)

### v0.6
+ Rule, for generating file-tasks on the fly
+ WatchTask, for running tasks on file/directory changes
+ Return values for tasks
+ Promise-based async task completion
+ Multiple Git branches for NpmPublishTask
+ Linting codebase with JSHint
+ Filled out top-level API methods for creating other task-types
* Better API for including/excluding files from NpmPublishTask

### v0.5
+ Interactive exec
+ Node v0.10 compatibility (fixed their broken PPI)
+ Docs for async management with manual invocation
+ More lifecycle events emitted
* Better Windows support for FileList pathnames
* Faster FileTask execution

### v0.4
+ Embeddable Jake, non-CLI use

### v0.3
+ TestTask, for minimal test-running
+ Chaining support for FileList API
+ Node v0.8 compatibility
+ Added -q / quiet flag for suppressing output
* Migrated FileUtils into 'utilities' NPM library
* Numerous PackageTask archiving fixes
* `namespace` appends instead of overwriting

### v0.2
+ NpmPublishTask, for automating NPM publishing
+ FileUtils, for sync filesystem manipulation
+ Evented tasks
+ Streamed output from jake.exec
+ Numerous Windows fixes for jake.exec
+ Shit-ton of new tests
* Massive refactor of task/file-task/directory-task

### v0.1
+ FileTask, DirectoryTask
+ PackageTask, for easy project packaging
+ FileList, for lazy-access of long lists of filenames, pattern-matching
+ zsh support
+ Multiple targets from CLI
+ 'async' Boolean to options object
+ Always-make flag
+ -T for listing tasks
+ Passed params from CLI
+ `invoke`, `execute`, `reenable` methods on tasks
+ Task emits on completion
+ Custom exit-status for fail
+ Recursive directory-search for Jakefile
+ Added proper license notice
+ Basic suite of integration tests
+ Added package.json
+ Coffeescript support
+ Basic Windows support
* Switch from node-glob to minimatch for globbing

### v0.0
+ Use Rake-style syntax instead of object-literal to define tasks
+ jake main module as basic task-runner
