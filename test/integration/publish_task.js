let assert = require('assert');
const { execJake, ensureDirs } = require('./helpers');

suite('publishTask', function () {

  this.timeout(7000);

  setup(function () {
    ensureDirs(false, 'pkg', 'tmp_publish');
  });

  test('default task', function () {
    assert.equal(execJake('-q publish'), [
      'Fetched remote tags.',
      'On branch v0.0',
      'Bumped version number to v0.0.2.',
      'Created package for zerb v0.0.2',
      'Publishing zerb v0.0.2',
      './pkg/zerb-v0.0.2.tar.gz',
      'BOOM! Published.',
      'Cleaned up package',
    ].join('\n'));

    ensureDirs(false, 'pkg', 'tmp_publish');
  });

});

