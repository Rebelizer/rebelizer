require('expectations');

var fs = require('fs')
    , path = require('path')
    , PEG = require('pegjs')
    , jsExpressionPath = path.resolve(__dirname, '../peg/js-expression.peg')

function makeFn(config) {
  var js = '(function($scope) {' + config.verables + ';return ' + config.code + ';})';
  return eval(js)
}

describe('js expression', function() {

  var parser;

  before(function(done){
    parser = PEG.buildParser(fs.readFileSync(jsExpressionPath, 'utf8')).parse;
    done();
  });

  it("should parse single field", function() {
    var result = parser('FOO');
//    expect(result).toEqual({ code: 'typeof FOO !== "undefined" && FOO !== null ? FOO : void 0', verables: 'var _ref0' });
  });

    it("should parse multi fields", function() {
        /*var result = parser('A.B');
        expect(result).toEqual({ code: 'typeof A !== "undefined" && A !== null ? A[B] : void 0', verables: 'var _ref0' });

        result = parser('A.B.C');
        expect(result).toEqual({ code: 'typeof A !== "undefined" && A !== null ? (_ref1 = A[B]) != null ? _ref1[C] : void 0 : void 0', verables: 'var _ref1' });

        result = parser('A.B.C.D');
        expect(result).toEqual({ code: 'typeof A !== "undefined" && A !== null ? (_ref1 = A[B]) != null ? (_ref2 = _ref1[C]) != null ? _ref2[D] : void 0 : void 0 : void 0', verables: 'var _ref2,_ref1' });
*/
    });

    it("should parse array based field using digit", function() {
        var result = parser('FOO.1');
    });

    it("should parse array field", function() {
        var result = parser('FOO[1]');
    });

    it("should parse sub array field", function() {
        var result = parser('FOO[1][2]');
    });

    it("should parse field after an array", function() {
        var result = parser('FOO[1].foo');
    });

    it("should parse complex references", function() {
        //var result = parser('FOO[1].FOO[2]');
    });

    it("should parse complex array references", function() {
        var result = parser('FOO[nice.foo]');
    });

    it("should parse nested statements", function() {
        var result = parser('FOO[nice[0]]');
    });

    it("should create valid js", function() {
        var result = parser('$scope.FOO');
        result = makeFn(result);
        console.log(result.toString())
        console.log(result({}))
    });

});
