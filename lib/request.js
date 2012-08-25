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
var http = require('http')
  , https = require('https')
  , url = require('url')
  , uri = require('./uri')
  , log = require('./log')
  , core = require('./core');

var formatters = {
  xml: function (data) {
    return data;
  }
, html: function (data) {
    return data;
  }
, txt: function (data) {
    return data;
  }
, json: function (data) {
    return JSON.parse(data);
  }
}

var request = function (options, callback) {
  var client
    , opts = options || {}
    , parsed = url.parse(opts.url)
    , path
    , requester = parsed.protocol == 'http:' ? http : https
    , method = (opts.method && opts.method.toUpperCase()) || 'GET'
    , headers = core.mixin({}, opts.headers || {})
    , contentLength
    , port
    , clientOpts;

  if (parsed.port) {
    port = parsed.port;
  }
  else {
    port = parsed.protocol == 'http:' ? '80' : '443';
  }

  path = parsed.pathname;
  if (parsed.search) {
    path += parsed.search;
  }

  if (method == 'POST' || method == 'PUT') {
    if (opts.data) {
      contentLength = opts.data.length;
    }
    else {
      contentLength = 0
    }
    headers['Content-Length'] = contentLength;
  }

  clientOpts = {
    host: parsed.hostname
  , port: port
  , method: method
  , agent: false
  , path: path
  , headers: headers
  };
  client = requester.request(clientOpts);

  client.addListener('response', function (resp) {
    var data = ''
      , dataType;
    resp.addListener('data', function (chunk) {
      data += chunk.toString();
    });
    resp.addListener('end', function () {
      var stat = resp.statusCode
        , err;
      // Successful response
      if ((stat > 199 && stat < 300) || stat == 304) {
        dataType = opts.dataType || uri.getFileExtension(parsed.pathname);
        if (formatters[dataType]) {
          try {
            if (data) {
              data = formatters[dataType](data);
            }
          }
          catch (e) {
            callback(e, null);
          }
        }
        callback(null, data);
      }
      // Something failed
      else {
        err = new Error(data);
        err.statusCode = resp.statusCode;
        callback(err, null);
      }

    });
  });

  client.addListener('error', function (e) {
    callback(e, null);
  });

  if ((method == 'POST' || method == 'PUT') && opts.data) {
    client.write(opts.data);
  }

  client.end();
};

module.exports = request;
