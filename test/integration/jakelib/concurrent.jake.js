
namespace('concurrent', function () {
  task('A', function () {
    console.log('Started A');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Finished A');
        resolve();
      }, 200);
    });
  });

  task('B', function () {
    console.log('Started B');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Finished B');
        resolve();
      }, 50);
    });
  });

  task('C', function () {
    console.log('Started C');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Finished C');
        resolve();
      }, 100);
    });
  });

  task('D', function () {
    console.log('Started D');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Finished D');
        resolve();
      }, 300);
    });
  });

  task('Ba', ['A'], function () {
    console.log('Started Ba');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Finished Ba');
        resolve();
      }, 50);
    });
  });

  task('Afail', function () {
    console.log('Started failing task');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Failing B with error');
        throw new Error('I failed');
      }, 50);
    });
  });

  task('simple1', ['A','B'], {concurrency: 2}, function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('simple2', ['C','D'], {concurrency: 2}, function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('seqconcurrent', ['simple1','simple2'], function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('concurrentconcurrent', ['simple1','simple2'], {concurrency: 2}, function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('subdep', ['A','Ba'], {concurrency: 2}, function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('fail', ['A', 'B', 'Afail'], {concurrency: 3}, function () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
  });

  task('invoke1', function () {
    let t = jake.Task['concurrent:seqconcurrent'];

    console.log('Started invoke1');
    return new Promise((resolve) => {
      t.addListener('complete', () => {
        console.log('Finished invoke1');
        resolve();
      });
      t.invoke();
    });
  });

  task('invoke2', function () {
    let t = jake.Task['concurrent:seqconcurrent'];

    console.log('Started invoke2');
    return new Promise((resolve) => {
      t.addListener('complete', () => {
        console.log('Finished invoke2');
        resolve();
      });
      t.invoke();
    });
  });

  task('invoke', ['invoke1', 'invoke2'], {concurrency: 2});
});


