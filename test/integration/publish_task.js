let assert = require('assert');
let exec = require('child_process').execSync;
let spawnSync = require('child_process').spawnSync;

const PROJECT_DIR = process.env.PROJECT_DIR;
const JAKE_CMD = `${PROJECT_DIR}/bin/cli.js`;

suite('publishTask', function () {

  this.timeout(7000);

  test('default task', function () {
    let out = exec(`${JAKE_CMD} -q publish`).toString().trim();
    let expected = [
      'Fetched remote tags.'
      , 'On branch v0.0'
      , 'Bumped version number to v0.0.2.'
      , 'Created package for zerb v0.0.2'
      , 'Publishing zerb v0.0.2'
      , './pkg/zerb-v0.0.2.tar.gz'
      , 'BOOM! Published.'
      , 'Cleaned up package'
      , 'Pushed v0.0.2 to origin/v0.0.'
    ].join('\n');
    assert.equal(expected, out);
  });

  test('failed publish does not push and prints recovery steps', function () {
    let res = spawnSync(JAKE_CMD, ['-q', 'publish'], {
      env: Object.assign({}, process.env, {ZERB_FAIL: '1'})
    });
    let out = res.stdout.toString();
    let err = res.stderr.toString();
    assert.notEqual(0, res.status);
    assert.ok(out.indexOf('Bumped version number to v0.0.2.') > -1);
    assert.equal(-1, out.indexOf('Pushed'));
    assert.ok(err.indexOf('have not been pushed') > -1);
    assert.ok(err.indexOf('echo push origin v0.0.2') > -1);
    assert.ok(err.indexOf('echo tag -d v0.0.2') > -1);
  });

  test('npm tarball has only files, all under package/', function () {
    let out = exec(`${JAKE_CMD} -q listPackage`, {timeout: 5000})
      .toString().trim();
    let entries = out.split('\n').filter(function (line) {
      return line.indexOf('Created package') !== 0;
    });
    let names = entries.map(function (line) {
      return line.split(/\s+/).pop();
    }).sort();
    assert.deepEqual(['package/package.json', 'package/tmp_publish/foo.txt'],
      names);
    entries.forEach(function (line) {
      assert.equal('-', line.charAt(0), 'Not a regular file: ' + line);
    });
  });

  test('cleanup resolves on _done without a complete event', function () {
    let out = exec(`${JAKE_CMD} -q cleanupUsesDoneEvent`, {timeout: 2000})
      .toString().trim();
    assert.equal('Cleaned up package', out);
  });

  test('package can be used as a prerequisite', function () {
    let out = exec(`${JAKE_CMD} -q packageAsPrereq`, {timeout: 2000})
      .toString().trim();
    let expected = [
      'Created package for zerb v0.0.1'
      , 'true'
    ].join('\n');
    assert.equal(expected, out);
  });

  test('createPackage returns a promise for package completion', function () {
    let out = exec(`${JAKE_CMD} -q createPackagePromise`, {timeout: 2000})
      .toString().trim();
    assert.equal('true', out);
  });

});
