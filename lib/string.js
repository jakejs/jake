/*
 * JSTools JavaScript utilities
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
  // Regexes used in trimming functions
  var _LTR = /^\s+/;
  var _RTR = /\s+$/;
  var _TR = /^\s+|\s+$/g;
  var _NL = /\n|\r|\r\n/g;
  // From/to char mappings -- for the XML escape,
  // unescape, and test for escapable chars
  var _CHARS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  };
  var _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  // Builds the escape/unescape methods using a common
  // map of characters
  var _buildEscapes = function (direction) {
    return function (str) {
      s = str || '';
      s = s.toString();
      var fr, to;
      for (var p in _CHARS) {
        fr = direction == 'to' ? p : _CHARS[p];
        to = direction == 'to' ? _CHARS[p] : p;
        s = s.replace(new RegExp(fr, 'gm'), to);
      }
      return s;
    };
  };
  // Builds a method that tests for any of the escapable
  // characters -- useful for avoiding double-escaping if
  // you're not sure whether a string is already escaped
  var _buildEscapeTest = function (direction) {
    return function (s) {
      var pat = '';
      for (var p in _CHARS) {
        pat += direction == 'to' ? p : _CHARS[p];
        pat += '|';
      }
      pat = pat.substr(0, pat.length - 1);
      pat = new RegExp(pat, "gm");
      return pat.test(s);
    };
  };

  // Escape special chars to entities
  this.escapeXML = _buildEscapes('to');

  // Unescape entities to special chars
  this.unescapeXML = _buildEscapes('from');

  // Test if a string includes special chars that
  // require escaping
  this.needsEscape = _buildEscapeTest('to');

  this.needsUnescape = _buildEscapeTest('from');

  this.toArray = function (str) {
    var arr = [];
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.substr(i, 1);
    }
    return arr;
  };

  this.reverse = function (str) {
    return this.toArray(str).reverse().join('');
  };

  this.ltrim = function (str, chr) {
    var pat = chr ? new RegExp('^' + chr + '+') : _LTR;
    return str.replace(pat, '');
  };

  this.rtrim = function (str, chr) {
    var pat = chr ? new RegExp(chr + '+$') : _RTR;
    return str.replace(pat, '');
  };

  this.trim = function (str, chr) {
    var pat = chr ? new RegExp('^' + chr + '+|' + chr + '+$', 'g') : _TR;
    return str.replace(pat, '');
  };

  this.lpad = function (str, chr, width) {
    var s = str || ''
      , len = s.length;
    if (width > len) {
      s = (new Array(width - len + 1)).join(chr) + s;
    }
    return s;
  };

  this.rpad = function (str, chr, width) {
    var s = str || ''
      , len = s.length;
    if (width > len) {
      s = s + (new Array(width - len + 1)).join(chr);
    }
    return s;
  };

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

  this.truncateHTML = function(string, options, callback) {
    if (!string) return;
    var returnString = '';

    // If `options` is a number assume it's the length and create a options object with length
    if (typeof options === 'number') {
      var num = options;

      options = {};
      options.length = num;
    } else options = options || {};

    // Set `default` options for HTML specifics
    options.once = options.once || false;

    var pat = /(<[^>]*>)/ // Patter for matching HTML tags
      , arr = [] // Holds the HTML tags and content seperately
      , truncated = false
      , result = pat.exec(string)
      , item
      , firstPos
      , lastPos;

    // Gather the HTML tags and content into the array
    while (result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if (firstPos !== 0) {
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
    if (string !== '') arr.push(string);

    // Loop through array items appending the tags to the string,
    // - and truncating the text then appending it to content
    for(var i in arr) {
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
          if (options.once && truncated) {
            returnString += item;
          } else {
            returnString += this.truncate(item, options, callback);
            truncated = true;
          }
          break;
      }
    }

    return returnString;
  };


  this.nl2br = function (str) {
	  return str.replace(_NL,'<br />');
  };

  // Converts someVariableName to some_variable_name
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

  // Converts some_variable_name to someVariableName or SomeVariableName
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

  this.capitalize = function (s) {
    return s.substr(0, 1).toUpperCase() + s.substr(1);
  };

  this.decapitalize = function (s) {
    return s.substr(0, 1).toLowerCase() + s.substr(1);
  };

  this.dasherize = function(s, replace) {
    return this.snakeize(s, '-');
  };

  /*
   * getInflections(name<String>, initialCap<String>)
   *
   * Returns an object that contains different inflections
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

  // From Math.uuid.js, http://www.broofa.com/Tools/Math.uuid.js
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function (len, rad) {
    var chars = _UUID_CHARS
      , uuid = []
      , radix = rad || chars.length
      , r;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    }
    else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
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

