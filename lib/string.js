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
var core = require('./core')
  , inflection = require('../deps/inflection')
  , string;

string = new (function () {

  // Regexes for trimming, and character maps for escaping
  var _LTR = /^\s+/
    , _RTR = /\s+$/
    , _TR = /^\s+|\s+$/g
    , _NL = /\n|\r|\r\n/g
    , _CHARS = {
          '&': '&amp;'
        , '<': '&lt;'
        , '>': '&gt;'
        , '"': '&quot;'
        , '\'': '&#39;'
      }
    , _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    , _buildEscape
    , _buildEscapeTest;

  // Builds the escape/unescape methods using a
  // map of characters
  _buildEscape = function(direction) {
    return function(string) {
      string = string || '';
      string = string.toString();

      var from, to, p;
      for(p in _CHARS) {
        from = direction == 'to' ? p : _CHARS[p];
        to = direction == 'to' ? _CHARS[p] : p;

        string = string.replace(new RegExp(from, 'gm'), to);
      }

      return string;
    }
  };

  // Builds a method that tests for any escapable
  // characters, useful for avoiding double-scaping if
  // you're not sure if a string has already been escaped
  _buildEscapeTest = function(direction) {
    return function(string) {
      var pat = ''
        , p;

      for(p in _CHARS) {
        pat += direction == 'to' ? p : _CHARS[p];
        pat += '|';
      }

      pat = pat.substr(0, pat.length - 1);
      pat = new RegExp(pat, "gm");
      return pat.test(string)
    }
  };

  // Escape special XMl chars
  this.escapeXML = _buildEscape('to');

  // Unescape XML chars to literal representation
  this.unescapeXML = _buildEscape('from');

  // Test if a string includes special chars
  // that need escaping
  this.needsEscape = _buildEscapeTest('to');

  // Test if a string includes escaped chars
  // that need unescaping
  this.needsUnescape = _buildEscapeTest('from');

  /*
   * toArray(string<String>)
   *
   * ToArray converts a String to an Array
   *
   * Examples:
   *   toArray("geddy")
   *   => ["g", "e", "d", "d", "y"]
  */
  this.toArray = function(string) {
    if(!string) {
      return;
    }

    var arr = []
      , i = -1;

    while(++i < string.length) {
      arr.push(string.substr(i, 1));
    }

    return arr;
  };

  /*
   * reverse(string<String>)
   *
   * Reverse returns a Strings with `string` reversed
   *
   * Examples:
   *   reverse("yddeg")
   *   => "geddy"
  */
  this.reverse = function(string) {
    if(!string) {
      return;
    }
    return this.toArray(string).reverse().join('');
  };

  /*
   * ltrim(string<String>, char<String>)
   *
   * Ltrim trims `char` from the left of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.ltrim = function(string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp('^' + char + '+') : _LTR;
    return string.replace(pat, '');
  };

  /*
   * rtrim(string<String>, char<String>)
   *
   * Rtrim trims `char` from the right of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.rtrim = function (string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp(char + '+$') : _RTR;
    return string.replace(pat, '');
  };

  /*
   * trim(string<String>, char<String>)
   *
   * Trim trims `char` from the right and left of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.trim = function (string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp('^' + char + '+|' + char + '+$', 'g') : _TR;
    return string.replace(pat, '');
  };

  /*
   * lpad(string<String>, char<String>, width<Number>)
   *
   * Lpad adds `char` to the left of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   lpad("geddy", "&", 7)
   *   => "&&geddy"
  */
  this.lpad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string.toString();

    while(s.length < width) {
      s = char + s;
    }
    return s;
  };

  /*
   * rpad(string<String>, char<String>, width<Number>)
   *
   * Rpad adds `char` to the right of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   rpad("geddy", "&", 7)
   *   => "geddy&&"
  */
  this.rpad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string;

    while(s.length < width) {
      s += char;
    }
    return s;
  };

  /*
   * pad(string<String>, char<String>, width<Number>)
   *
   * Pad adds `char` to the right and left of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   pad("geddy", "&", 7)
   *   => "&geddy&"
  */
  this.pad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string;

    while(s.length < width) {
      s = char + s + char;
    }
    return s;
  };

  /*
   * truncate(string<String>, options<Integer/Object>, callback[Function])
   *
   * Truncates a given `string` after a specified `length` if `string` is longer than
   * `length`. The last characters will be replaced with an `omission` for a total length not
   * exceeding `length`. If `callback` is given it will fire if `string` is truncated.
   *
   * Options:
   *   length    <Integer>          Length the output string will be(default: 30)
   *   len       <Integer>          Alias for length
   *   omission  <String>           Replace last letters with an omission(default: '...')
   *   ellipsis  <String>           Alias for omission
   *   seperator <String>/<RegExp>  Break the truncated text at the nearest `seperator`
   *
   * Warnings:
   *   Please be aware that truncating HTML tags or entities may result in malformed HTML returned
   *
   * Examples:
   *   truncate('Once upon a time in a world', { length: 10 })
   *   => 'Once up...'
   *
   *  truncate('Once upon a time in a world', { length: 20, omission: '...(continued)' })
   *   => 'Once u...(continued)'
   *
   *  truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
   *   => 'Once upon a...'
   *   Normal Output: => 'Once upon a ...'
   *
   *  truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
   *   => 'Once upon a...'
   *   Normal Output: => 'Once upon a ...'
   *
   *  truncate('<p>Once upon a time</p>', { length: 20 })
   *   => '<p>Once upon a ti...'
  */
  this.truncate = function(string, options, callback) {
    if (!string) {
      return;
    }

    var stringLen = string.length
      , opts
      , stringLenWithOmission
      , last
      , ignoreCase
      , multiLine
      , stringToWorkWith
      , lastIndexOf
      , nextStop
      , result
      , returnString;

    // If `options` is a number, assume it's the length and
    // create a options object with length
    if (typeof options === 'number') {
      opts = {
        length: options
      };
    }
    else {
      opts = options || {};
    }

    // Set `opts` defaults
    opts.length = opts.length || 30;
    opts.omission = opts.omission || opts.ellipsis || '...';

    stringLenWithOmission = opts.length - opts.omission.length;

    // Set the index to stop at for `string`
    if (opts.seperator) {
      if (opts.seperator instanceof RegExp) {
        // If `seperator` is a regex
        if (opts.seperator.global) {
          opts.seperator = opts.seperator;
        } else {
          ignoreCase = opts.seperator.ignoreCase ? 'i' : ''
          multiLine = opts.seperator.multiLine ? 'm' : '';
          opts.seperator = new RegExp(opts.seperator.source,
              'g' + ignoreCase + multiLine);
        }
        stringToWorkWith = string.substring(0, stringLenWithOmission + 1)
        lastIndexOf = -1
        nextStop = 0

        while ((result = opts.seperator.exec(stringToWorkWith))) {
          lastIndexOf = result.index;
          opts.seperator.lastIndex = ++nextStop;
        }
        last = lastIndexOf;
      }
      else {
        // Seperator is a String
        last = string.lastIndexOf(opts.seperator, stringLenWithOmission);
      }

      // If the above couldn't be found, they'll default to -1 so,
      // we need to just set it as `stringLenWithOmission`
      if (last === -1) {
        last = stringLenWithOmission;
      }
    }
    else {
      last = stringLenWithOmission;
    }

    if (stringLen < opts.length) {
      return string;
    }
    else {
      returnString = string.substring(0, last) + opts.omission;
      returnString += callback ? callback() : '';
      return returnString;
    }
  };

  /*
   * truncateHTML(string<String>, options<Object>, callback[Function])
   *
   * Truncates a given `string` inside HTML tags after a specified `length` if string` is longer than
   * `length`. The last characters will be replaced with an `omission` for a total length not
   * exceeding `length`. If `callback` is given it will fire if `string` is truncated. If `once` is
   * true only the first string in the first HTML tags will be truncated leaving the others as they
   * were
   *
   * Options:
   *   once <Boolean> If true it will only truncate the first text found in the first
   *                  set of HTML tags(default: false)
   *
   * Notes:
   *   * All options available in the `truncate` helper are also available in `truncateHTML`
   *   * HTML tags will not be truncated, so return value will always be safe  for rendering
   *
   * Examples:
   *   truncateHTML('<p>Once upon a time in a world</p>', { length: 10 })
   *   => '<p>Once up...</p>'
   *
   *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 })
   *   => '<p>Once up...<small>in a wo...</small></p>'
   *
   *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true })
   *   => '<p>Once up...<small>in a world</small></p>'
  */
  this.truncateHTML = function(string, options, callback) {
    if(!string) {
      return;
    }
    var returnString = ''
      , opts = options;

    // If `options` is a number assume it's the length and create a options object with length
    if(typeof opts === 'number') {
      var num = opts;

      opts = {};
      opts.length = num;
    } else opts = opts || {};

    // Set `default` options for HTML specifics
    opts.once = opts.once || false;

    var pat = /(<[^>]*>)/ // Patter for matching HTML tags
      , arr = [] // Holds the HTML tags and content seperately
      , truncated = false
      , result = pat.exec(string)
      , item
      , firstPos
      , lastPos
      , i;

    // Gather the HTML tags and content into the array
    while(result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if(firstPos !== 0) {
        // Should be content not HTML tags
        arr.push(string.substring(0, firstPos));
        // Slice content from string
        string = string.slice(firstPos);
      }

      arr.push(result[0]); // Push HTML tags
      string = string.slice(result[0].length);

      // Re-run the pattern on the new string
      result = pat.exec(string);
    }
    if(string !== '') arr.push(string);

    // Loop through array items appending the tags to the string,
    // - and truncating the text then appending it to content
    i = -1;
    while(++i < arr.length) {
      item = arr[i];
      switch(true) {
        // Closing tag
        case item.indexOf('</') == 0:
          returnString += item;
          openTag = null;
          break;
        // Opening tag
        case item.indexOf('<') == 0:
          returnString += item;
          openTag = item;
          break;
        // Normal text
        default:
          if(opts.once && truncated) {
            returnString += item;
          } else {
            returnString += this.truncate(item, opts, callback);
            truncated = true;
          }
          break;
      }
    }

    return returnString;
  };

  /*
   * nl2br(string<String>)
   *
   * Nl2br returns a string where all newline chars are turned
   * into line break HTML tags
   *
   * Examples:
   *   nl2br("geddy\n")
   *   => "geddy<br />"
  */
  this.nl2br = function(string) {
    if(!string) {
      return;
    }

    return string.replace(_NL,'<br />');
  };

  /*
   * snakeize(string<String>)
   *
   * Snakeize converts camelCase and CamelCase strings to snake_case strings
   *
   * Examples:
   *   snakeize("geddyJs")
   *   => "geddy_js"
  */
  this.snakeize = (function () {
    // Only create regexes once on initial load
    var repl = /([A-Z]+)/g
      , lead = /^_/g;
    return function (str, separ) {
      if (!str) {
        return;
      }
      var sep = separ || '_'
        , leading = separ ? new RegExp('^' + sep, 'g') : lead;
      return str.replace(repl, sep + '$1').toLowerCase().
        replace(leading, '');
    };
  }).call(this);

  // Aliases
  this.decamelize = this.snakeize;
  this.underscoreize = this.snakeize;

  /*
   * camelize(string<String>, options<Object>)
   *
   * Camelize takes a string and optional options and
   * returns a camelCase version of the given `string`
   *
   * Options:
   *   initialCap <Boolean> If initialCap is true the returned
   *                        string will have a capitalized first letter
   *   leadingUnderscore <Boolean> If leadingUnderscore os true then if
   *                               an underscore exists at the beggining
   *                               of the string, it will stay there.
   *                               Otherwise it'll be removed.
   *
   * Examples:
   *   camelize("geddy_js")
   *   => "geddyJs"
   *
   *   camelize("geddy_js", {initialCap: true})
   *   => "GeddyJs"
   *
   *   camelize("geddy_js", {leadingUnderscore: true})
   *   => "_geddyJs"
  */
  this.camelize = (function () {
    // Only create regex once on initial load
    var repl = /[-_](\w)/g;
    return function (str, options) {
      var ret
        , config = {
            initialCap: false
          , leadingUnderscore: false
          }
        , opts = options || {};

      if (!str) {
        return;
      }

      // Backward-compat
      if (typeof opts == 'boolean') {
        config = {
          initialCap: true
        };
      }
      else {
        core.mixin(config, opts);
      }

      ret = str.replace(repl, function (m, m1) {
        return m1.toUpperCase();
      });

      if (config.leadingUnderscore & str.indexOf('_') === 0) {
        ret = '_' + this.decapitalize(ret);
      }
      // If initialCap is true capitalize it
      ret = config.initialCap ? this.capitalize(ret) : this.decapitalize(ret);

      return ret;
    };
  }).call(this);

  /*
   * decapitalize(string<String>)
   *
   * Decapitalize returns the given string with the first letter
   * uncapitalized.
   *
   * Examples:
   *   decapitalize("String")
   *   => "string"
  */
  this.decapitalize = function (string) {
    if(!string) {
      return;
    }

    return string.substr(0, 1).toLowerCase() + string.substr(1);
  };

  /*
   * capitalize(string<String>)
   *
   * Capitalize returns the given string with the first letter
   * capitalized.
   *
   * Examples:
   *   decapitalize("string")
   *   => "String"
  */
  this.capitalize = function (string) {
    if(!string) {
      return;
    }

    return string.substr(0, 1).toUpperCase() + string.substr(1);
  };

  /*
   * dasherize(string<String>, replace<String>)
   *
   * Dasherize returns the given `string` converting camelCase and snakeCase
   * to dashes or replace them with the `replace` character.
  */
  this.dasherize = function(s, replace) {
    var repl = replace || '-'
    return this.snakeize(s, repl);
  };

  /*
   * underscorize(string<String>)
   *
   * Underscorize returns the given `string` converting camelCase and snakeCase
   * to underscores.
  */
  this.underscorize = function(string) {
    if(!string) {
      return;
    }

    return this.dasherize(string, '_');
  };

  /*
   * getInflections(name<String>, initialCap<String>)
   *
   * Inflection returns an object that contains different inflections
   * created from the given `name`
  */
  this.getInflections = function (name, options) {
    var opts = options || {}
      , initialCap;

    if (!name) {
      return;
    }

    // Backward-compat
    if (typeof opts == 'boolean') {
      opts = {
        initialCap: true
      };
    }

    initialCap = opts.initialCap;

    var self = this
      , normalizedName = this.snakeize(name)
      , nameSingular = inflection.singularize(normalizedName)
      , namePlural = inflection.pluralize(normalizedName);

    return {
      // For filepaths or URLs
      filename: {
        // neil_peart
        singular: nameSingular
        // neil_pearts
      , plural: namePlural
      }
      // Constructor names
    , constructor: {
        // NeilPeart
        singular: self.camelize(nameSingular, {initialCap: true})
        // NeilPearts
      , plural: self.camelize(namePlural, {initialCap: true})
      }
    , property: {
        // neilPeart
        singular: self.camelize(nameSingular)
        // neilPearts
      , plural: self.camelize(namePlural)
      }
    };
  };

  // From Math.uuid.js, https://github.com/broofa/node-uuid
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function(length, radix) {
    var chars = _UUID_CHARS
      , uuid = []
      , r
      , i;

    radix = radix || chars.length;

    if(length) {
      // Compact form
      i = -1;
      while(++i < length) {
        uuid[i] = chars[0 | Math.random()*radix];
      }
    } else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      i = -1;
      while(++i < 36) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

})();

module.exports = string;

