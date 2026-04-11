const PROJECT_DIR = process.env.PROJECT_DIR;

let assert = require('assert');
let fs = require('fs');
let jake = require(`${PROJECT_DIR}/lib/jake`);

const TEST_ROOT = 'tmp_filelist';

suite('fileList', function () {
  setup(function () {
    fs.mkdirSync(`${TEST_ROOT}/one/two/three`, { recursive: true });
    fs.mkdirSync(`${TEST_ROOT}/one/exclude`, { recursive: true });

    fs.writeFileSync(`${TEST_ROOT}/one/two/three/file.txt`, 'hello');
    fs.writeFileSync(`${TEST_ROOT}/one/exclude/file.txt`, 'world');
  });

  teardown(function () {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  test('matches globs with windows path separators', function () {
    let filelist = new jake.FileList();
    let matches;

    filelist.include('tmp_filelist\\one\\**\\*.txt');
    matches = filelist.toArray().sort();

    assert.deepEqual(matches, [
      'tmp_filelist/one/exclude/file.txt',
      'tmp_filelist/one/two/three/file.txt'
    ]);
  });
});
