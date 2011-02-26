sys = require('sys')

desc 'This is the default task.'
task 'default', [], (params) ->
  console.log 'This is the default task from the coffee script Jakefile'
  console.log(sys.inspect(arguments))
