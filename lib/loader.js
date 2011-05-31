var path = require('path')
  , Loader;


Loader = function () {
  this.load = function (file) {
    var jakefile = file ?
            file.replace(/\.js$/, '').replace(/\.coffee$/, '') : 'Jakefile'
      , fileSpecified = !!file
      // Dear God, why?
      , isCoffee = false
      // Warning, recursive
      , exists = function () {
          var cwd = process.cwd();
          if (path.existsSync(jakefile) || path.existsSync(jakefile + '.js') ||
            path.existsSync(jakefile + '.coffee')) {
            return true;
          }
          if (!fileSpecified) {
            process.chdir("..");
            if (cwd === process.cwd()) {
              return false;
            }
            return exists();
          }
        };

    if (!exists()) {
      fail('No Jakefile. Specify a valid path with -f/--jakefile, or place one in the current directory.');
    }

    isCoffee = path.existsSync(jakefile + '.coffee');
    if (isCoffee) {
      try {
        CoffeeScript = require('coffee-script');
      }
      catch (e) {
        program.die('CoffeeScript is missing! Try `npm install coffee-script`');
      }
    }
    jakefile = path.join(process.cwd(), jakefile);
    require(jakefile);
  };

};

module.exports.Loader = Loader;
