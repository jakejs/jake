let { doesNotThrow } = require('assert');
let { execJake } = require('./helpers');

suite('listTasks', function () {

  test('execute "jake -T" without any errors', function () {
    doesNotThrow(() => execJake('-T'), TypeError, 'cannot run "jake -T" command');
  });

});
