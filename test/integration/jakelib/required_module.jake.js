let { task, namespace } = require(`../../../lib/jake`);

namespace('usingRequire', function () {
  task('test', () => {
    console.log('howdy test');
  });
});



