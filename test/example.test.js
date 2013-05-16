describe('example', function () {
  it('simple check', function (done) {
    done();
  });

  describe('math', function () {
    it('1 == 1', function (done) {
      if (1 == 1) {
        done();
      }
    });

    it('setTimeout check', function (done) {
      setTimeout(function () {
        checkit(done);
      }, 30);
    });
  });
});

function checkit(done) {
  done();
}