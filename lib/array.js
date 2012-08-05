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

var array = new (function () {

  /*
    @name humanize
    @public
    @return {String} A string containing the array elements in a readable format
    @description Creates a string containing the array elements in a readable format
    @param {Array} array The array to humanize
  */
  this.humanize = function(array) {
    // If array only has one item then just return it
    if(array.length <= 1) {
      return String(array);
    }

    var last = array.pop()
      , items = array.join(', ');

    return items + ' and ' + last;
  };

  /*
   * included(item<Any>, array<Array>)
   *
   * Included checks if an `item` is included in a `array`
   * if it is found then the `array` is returned, otherwise
   * false is returned
   *
   * Examples:
   *   included("array", ["array"])
   *   => ["array"]
   *
   *   included("nope", ["array"])
   *   => false
  */

  /*
    @name included
    @public
    @return {Array/Boolean} If `item` is included the `array` is returned otherwise false
    @description Checks if an `item` is included in an `array`
    @param {Any} item The item to look for
    @param {Array} array The array to check
  */
  this.included = function(item, array) {
    var result = array.indexOf(item);

    if(result === -1) {
      return false;
    } else {
      return array;
    }
  };

})();

module.exports = array;
