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

/**
  @name inflection
  @namespace inflection
*/

var inflection = new (function () {

  /**
    @name inflection#inflections
    @public
    @object
    @description Includes different inflection types and the rules and replacements for them
  */
  this.inflections = {
      plurals: []
    , singulars: []
    , uncountables: []
  };

  var self = this
    , setInflection
    , setPlural
    , setSingular
    , setHuman
    , setUncountable
    , setIrregular
    , createInflections;

  /**
   * Creates a new pluralization rule with a replacement. The rule can be String or
   * RegExp. The replacement needs to be a string, the includes references to the matched rule.
   * Type is needed to set the specific inflection type
  */
  setInflection = function(rule, replacement, type) {
    self.inflections[type].unshift([rule, replacement]);
  };

  // Create a new plural inflection
  setPlural = function(rule, replacement) {
    setInflection(rule, replacement, 'plurals');
  };

  // Create a new singular inflection
  setSingular = function(rule, replacement) {
    setInflection(rule, replacement, 'singulars');
  };

  // Set a `word` to not attempted for inflection
  setUncountable = function(word) {
    self.inflections.uncountables[word] = true
  };

  // Set a new irregular inflection, using the given `singular` and `plural` versions
  // of the word
  setIrregular = function(singular, plural) {
    // Todo: This is fuckin ridiculous, we should probably clean it up
    if (singular.substr(0, 1).toUpperCase() == plural.substr(0, 1).toUpperCase()) {
      setPlural(new RegExp("(" + singular.substr(0, 1) + ")" + singular.substr(1) + "$", "i"),
        '$1' + plural.substr(1));
      setPlural(new RegExp("(" + plural.substr(0, 1) + ")" + plural.substr(1) + "$", "i"),
        '$1' + plural.substr(1));
      setSingular(new RegExp("(" + plural.substr(0, 1) + ")" + plural.substr(1) + "$", "i"),
        '$1' + singular.substr(1));
    } else {
      setPlural(new RegExp(singular.substr(0, 1).toUpperCase() + singular.substr(1) + "$"),
        plural.substr(0, 1).toUpperCase() + plural.substr(1));
      setPlural(new RegExp(singular.substr(0, 1).toLowerCase() + singular.substr(1) + "$"),
        plural.substr(0, 1).toLowerCase() + plural.substr(1));
      setPlural(new RegExp(plural.substr(0, 1).toUpperCase() + plural.substr(1) + "$"),
        plural.substr(0, 1).toUpperCase() + plural.substr(1));
      setPlural(new RegExp(plural.substr(0, 1).toLowerCase() + plural.substr(1) + "$"),
        plural.substr(0, 1).toLowerCase() + plural.substr(1));
      setSingular(new RegExp(plural.substr(0, 1).toUpperCase() + plural.substr(1) + "$"),
        singular.substr(0, 1).toUpperCase() + singular.substr(1));
      setSingular(new RegExp(plural.substr(0, 1).toLowerCase() + plural.substr(1) + "$"),
        singular.substr(0, 1).toLowerCase() + singular.substr(1));
    }
  };

  // Create some inflections
  (function() {
    setPlural(/$/, "s");
    setPlural(/s$/i, "s");
    setPlural(/(ax|test)is$/i, "$1es");
    setPlural(/(octop|vir)us$/i, "$1i");
    setPlural(/(alias|status)$/i, "$1es");
    setPlural(/(bu)s$/i, "$1ses");
    setPlural(/(buffal|tomat)o$/i, "$1oes");
    setPlural(/([ti])um$/i, "$1a");
    setPlural(/sis$/i, "ses");
    setPlural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
    setPlural(/(hive)$/i, "$1s");
    setPlural(/([^aeiouy]|qu)y$/i, "$1ies");
    setPlural(/(x|ch|ss|sh)$/i, "$1es");
    setPlural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
    setPlural(/([m|l])ouse$/i, "$1ice");
    setPlural(/^(ox)$/i, "$1en");
    setPlural(/(quiz)$/i, "$1zes");

    setSingular(/s$/i, "")
    setSingular(/(n)ews$/i, "$1ews")
    setSingular(/([ti])a$/i, "$1um")
    setSingular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis")
    setSingular(/(^analy)ses$/i, "$1sis")
    setSingular(/([^f])ves$/i, "$1fe")
    setSingular(/(hive)s$/i, "$1")
    setSingular(/(tive)s$/i, "$1")
    setSingular(/([lr])ves$/i, "$1f")
    setSingular(/([^aeiouy]|qu)ies$/i, "$1y")
    setSingular(/(s)eries$/i, "$1eries")
    setSingular(/(m)ovies$/i, "$1ovie")
    setSingular(/(x|ch|ss|sh)es$/i, "$1")
    setSingular(/([m|l])ice$/i, "$1ouse")
    setSingular(/(bus)es$/i, "$1")
    setSingular(/(o)es$/i, "$1")
    setSingular(/(shoe)s$/i, "$1")
    setSingular(/(cris|ax|test)es$/i, "$1is")
    setSingular(/(octop|vir)i$/i, "$1us")
    setSingular(/(alias|status)es$/i, "$1")
    setSingular(/^(ox)en/i, "$1")
    setSingular(/(vert|ind)ices$/i, "$1ex")
    setSingular(/(matr)ices$/i, "$1ix")
    setSingular(/(quiz)zes$/i, "$1")
    setSingular(/(database)s$/i, "$1")

    setIrregular("person", "people");
    setIrregular("man", "men");
    setIrregular("child", "children");
    setIrregular("sex", "sexes");
    setIrregular("move", "moves");
    setIrregular("cow", "kine");

    setUncountable("equipment");
    setUncountable("information");
    setUncountable("rice");
    setUncountable("money");
    setUncountable("species");
    setUncountable("series");
    setUncountable("fish");
    setUncountable("sheep");
    setUncountable("jeans");
  })();

  /**
    @name inflection#parse
    @public
    @function
    @return {String} Returns the inflection of the word from the the given inflection type
    @description Takes a word and a inflection type and returns the type version of the word
    @param {String} word A word to convert
    @param {String} type The type of inflection to use
  */
  this.parse = function(word, type) {
    var lowWord = word.toLowerCase()
      , inflections = self.inflections[type]
      , i = inflections.length
      , rule
      , replacement;

    if(self.inflections.uncountables[lowWord]) {
      return word;
    }

    while(--i >= 0) {
      rule = inflections[i][0];
      replacement = inflections[i][1];

      if(rule.test(word)) {
        return word.replace(rule, replacement);
      }
    }

    return word;
  };

  /**
    @name inflection#pluralize
    @public
    @function
    @return {String} The pluralize version of the given word
    @description Takes a singular word and returns the plural version of it
    @param {String} word A word to convert
  */
  this.pluralize = function(word) {
    return this.parse(word, 'plurals');
  };

  /**
    @name inflection#singularize
    @public
    @function
    @return {String} The singular version of the given word
    @description Takes a plural word and returns the singular version of it
    @param {String} word A word to convert
  */
  this.singularize = function(word) {
    return this.parse(word, 'singulars');
  };

})();

module.exports = inflection;
