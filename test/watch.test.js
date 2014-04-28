require('expectations');

var util = require('util')
  , watch = require('../lib/watch')

function testClass() {
  this.name = 'bob';
}

testClass.prototype.getName = function() {return this.name;}

describe('watch', function() {

  var watcher;
  var myData;

  beforeEach(function(done){
    myData = {
      myString: 'hello',
      myNumber: 123,
      myNaN: Number.NaN,
      myDate: new Date('1/1/2011'),
      myArray: [1,2,3],
      myObj: {a:1, b:2, c:3},
      myNull: null,
      myFn: function() {cosnole.log('fn 1');},
      myClass: new testClass()
    };
    myData.myCirculareReferance = myData;

    watcher = new watch(myData);
    done();
  });

  it("should see no change after initialization", function() {
    watcher.scan()
  });

  it("should reset after scan and not refire onChange event", function() {
    watcher.onChange('$scope.myString', function(now,old) {console.log('WWWW->',now,old);})
    myData.myString = "something";
    watcher.scan()
  });

  it("should monitor simple primitive changes", function() {
    watcher.onChange('$scope.myString', function(now,old) {console.log('->',now,old);})
    watcher.onChange('$scope.myNumber', function(now,old) {console.log('->',now,old);})
    watcher.onChange('$scope.myNaN', function(now,old) {console.log('->',now,old);})
    watcher.onChange('$scope.myNull', function(now,old) {console.log('->',now,old);})
    myData.myString = 'test';

    myData.myNumber = 0;
    myData.myNaN = "a string";
    myData.myNull = 'a string';

    watcher.scan()
  });

  // test re-fire on return true; with an edit like a computed prop
  // test the order of the onChanges/scan

  it("should monitor array changes", function() {
    watcher.onChange('$scope.myArray', function(now,old) {console.log('arra->',now,old);})
    myData.myArray.push(100);
    watcher.scan()
  });

  it("should monitor array reference changes", function() {
    watcher.onChange('$scope.myArray', function(now,old) {console.log('arra->',now,old);})
    myData.myArray = [1]
    watcher.scan()
  });


  it("should monitor changes", function() {
    watcher.onChange('$scope.myString', function(now,old) {console.log('->',now,old);})
    myData.myString = 'test';
    watcher.scan()
  });

  it("should monitor change of undefined", function() {
    watcher.onChange('$scope.unknown', function(now,old) {console.log('->',now,old);})
    myData.unknown = 'test';
    watcher.scan()
  });

  it("should monitor invalid", function() {
    watcher.onChange('foo', function(now,old) {console.log('->',now,old);})
    myData.unknown = 'test';
    watcher.scan()
  });

});