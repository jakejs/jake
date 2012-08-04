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

var XML = require('../lib/xml').XML
  , assert = require('assert')
  , obj
  , xml
  , res
  , serialize
  , tests;

serialize = function (o) {
  return XML.stringify(o, {whitespace: false});
};

tests = {

  'test serialized object': function () {
    obj = {foo: 'bar'};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo>bar</foo></object>';
    assert.equal(res, xml);
  }

, 'test array of numbers': function () {
    obj = [1, 2, 3];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><numbers type="array"><number>1</number><number>2</number><number>3</number></numbers>';
    assert.equal(res, xml);
  }

, 'test array of strings': function () {
    obj = ['foo', 'bar'];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><strings type="array"><string>foo</string><string>bar</string></strings>';
    assert.equal(res, xml);
  }

, 'test array of mixed datatypes': function () {
    obj = ['foo', 1];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><records type="array"><record>foo</record><record>1</record></records>';
    assert.equal(res, xml);
  }

, 'test array property of an object': function () {
    obj = {foo: ['bar', 'baz']};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo type="array"><foo>bar</foo><foo>baz</foo></foo></object>';
    assert.equal(res, xml);
  }

};

module.exports = tests;

