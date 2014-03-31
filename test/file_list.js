var FileList = require('../lib/file_list').FileList
  , fs = require("fs")
  , assert = require("assert")
  , tests;

tests = {

  'beforeEach': function () {
    jake.mkdirP("./test/tmp/one/two/three");
    jake.mkdirP("./test/tmp/one/exclude");

    fs.writeFileSync("./test/tmp/one/two/three/file.txt", "hello");
    fs.writeFileSync("./test/tmp/one/exclude/file.txt", "world");
  }

, 'afterEach': function () {
    jake.rmRf('./test/tmp/one', {silent: true});
  }

, 'path separator can be used by exclude': function () {
    var fileList = new FileList();
    fileList.include("test/tmp/one/**/*.txt");
    assert.equal(fileList.toArray().length, 2);
    fileList.exclude("tmp/one/exclude");
    assert.equal(fileList.toArray().length, 1);
  }

, 'returns a list of unique file entries': function () {
    var fileList = new FileList();
    fileList.include("test/tmp/one/**/*.txt");
    fileList.include("test/tmp/one/two/three/file.txt");
    assert.equal(fileList.toArray().length, 2);
  }

};

module.exports = tests;
