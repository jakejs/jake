var fs = require('fs');

var PackageTask = function (name, version, definition) {
  var def = {};
  if (typeof definition == 'function') {
    def = definition();
  }
  this.name = name;
  this.version = version;
  this.packageDir = 'pkg';
  this.tag = false;
  this.needTar = false;
  this.needTarGz = false;
  this.needTarBz2 = false;
  for (var p in def) {
    this[p] = def[p];
  }
  this.define();
};

PackageTask.prototype = new (function () {
  this.define = function () {
    var self = this;

    directory(this.packageDir);

    // Stub tasks
    desc('Build all the packages');
    task('package');

    desc('Force a rebuild of the package files')
    task({'repackage': ['clobberPackage', 'package']});

    desc('Remove package products')
    task('clobberPackage', function () {
      try {
        fs.rmdirSync(self.packageDir);
      }
      catch(e) {}
    });

    task({'clobber': ['clobberPackage']});

  };
})();

module.exports.PackageTask = PackageTask;

