### 0.7
+ Updated API for include/exclude in NPMPublishTask
+ beforeEach/afterEach for TaskTask
+ Custom publishing command for NPMPublishTask
+ FileList fixes for Windows
+ Fixed output for stdout/stderr when piped

### 0.6
+ Rule, for generating file-tasks on the fly
+ WatchTask, for running tasks on file/directory changes
+ Return values for tasks
+ Multiple Git branches for NpmPublishTask
+ Better API for including/excluding files from NpmPublishTask
+ JSHinted codebase

### 0.5
+ Interactive exec
+ Faster FileTask execution
+ Better Windows support for FileList pathnames
+ Node v0.10 compatibility (fixed their broken PPI)
+ Docs for async management with manual invocation

### 0.4
+ Embeddable Jake, non-CLI use

### 0.3
+ TestTask, for minimal test-running
+ Chaining support for FileList API
+ Node v0.8 compatibility
+ Migrated FileUtils into 'utilities' NPM library
+ `namespace` appends instead of overwriting
+ Numerous PackageTask archiving fixes

### 0.2
+ NpmPublishTask, for automating NPM publishing
+ FileUtils, for sync filesystem manipulation
+ Evented tasks
+ Streamed output from jake.exec
+ Numerous Windows fixes for jake.exec
+ Massive refactor of task/file-task/directory-task
+ Shit-ton of new tests

### 0.1
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
+ Custom exit-status for fail
+ Recursive directory-search for Jakefile
+ Switch from node-glob to minimatch for globbing
+ Added proper license notice
+ Basic suite of integration tests
+ Added package.json
+ Coffeescript support

### v0.0
+ Use Rake-style syntax instead of object-literal to define tasks
+ jake main module as basic task-runner
