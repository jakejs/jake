var assert = require('assert')
  , string = require('../lib/string');

tests = {

  'test reverse': function () {
    var str = 'abcdef'
      , actual = string.reverse(str);
    assert.equal('fedcba', actual);
  }

, 'test ltrim': function () {
    var str = '   foo'
      , actual = string.ltrim(str);
    assert.equal('foo', actual);
  }

, 'test rtrim': function () {
    var str = 'foo   '
      , actual = string.rtrim(str);
    assert.equal('foo', actual);
  }

, 'test trim': function () {
    var str = '   foo   '
      , actual = string.trim(str);
    assert.equal('foo', actual);
  }

, 'test lpad': function () {
    var str = 'foo'
      , actual = string.lpad(str, 'x', 7);
    assert.equal('xxxxfoo', actual);
  }

, 'test rpad': function () {
    var str = 'foo'
      , actual = string.rpad(str, 'x', 7);
    assert.equal('fooxxxx', actual);
  }

, 'test camelize basic': function () {
    var str = 'foo_bar_baz'
      , actual = string.camelize(str);
    assert.equal('fooBarBaz', actual);
  }

, 'test camelize no initial cap from capitalized snake': function () {
    var str = 'Foo_bar_baz'
      , actual = string.camelize(str);
    assert.equal('fooBarBaz', actual);
  }

, 'test camelize initial cap': function () {
    var str = 'foo_bar_baz'
      , actual = string.camelize(str, {initialCap: true});
    assert.equal('FooBarBaz', actual);
  }

, 'test camelize leading underscore': function () {
    var str = '_foo_bar_baz'
      , actual = string.camelize(str, {leadingUnderscore: true});
    assert.equal('_fooBarBaz', actual);
  }

};

module.exports = tests;


