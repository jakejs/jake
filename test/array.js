/*
 * Utilities: A classic collection of JavaScript utilities
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var assert = require('assert')
  , array = require('../lib/array')
  , tests;

tests = {

  'test basic humanize for array': function () {
    var data = array.humanize(["array", "array", "array"])
      , actual = "array, array and array";
    assert.equal(actual, data);
  }

, 'test humanize with two items for array': function() {
    var data = array.humanize(["array", "array"])
      , actual = "array and array";
    assert.equal(actual, data);
  }

, 'test humanize with two items for array': function() {
    var data = array.humanize(["array"])
      , actual = "array";
    assert.equal(actual, data);
  }

, 'test basic included for array': function() {
    var test = ["array"]
      , data = array.included("array", test)
      , actual = test;
    assert.equal(actual, data);
  }

, 'test false included for array': function() {
    var data = array.included("nope", ["array"])
      , actual = false;
    assert.equal(actual, data);
  }

, 'test false boolean included for array': function() {
    var test = ["array", false]
      , data = array.included(false, test)
      , actual = test;
    assert.equal(actual, data);
  }

};

module.exports = tests;


