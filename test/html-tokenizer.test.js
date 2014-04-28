require('expectations');

var fs = require('fs')
  , tree = require('../lib/dom-tree')

describe('html tokenizer', function() {

  var parser;

  before(function(done){
    tree.tokenizer(false, function(err, p) {parser = p; done();})
  });

  it("should parse empty string", function() {
    var result = parser.parse('');
    expect(result).toEqual([]);
  });

  it("should return non elements as strings", function() {
    var result = parser.parse('hello world');
    expect(result).toEqual(['hello world']);

    result = parser.parse('<test>hello world');
    expect(result).toEqual([ { tag: 'test', attr: null, type: 'TAG_OPEN' }, 'hello world' ]);

    result = parser.parse('hello world<test>');
    expect(result).toEqual([ 'hello world', { tag: 'test', attr: null, type: 'TAG_OPEN' } ]);

    result = parser.parse('hello world<test>!');
    expect(result).toEqual([ 'hello world', { tag: 'test', attr: null, type: 'TAG_OPEN' }, '!' ]);

    result = parser.parse('hello world<test>   ');
    expect(result).toEqual([ 'hello world', { tag: 'test', attr: null, type: 'TAG_OPEN' }, '   ' ]);
  });

  it("should handle attrubutes with out values", function() {
    var result = parser.parse('<  hello attr1>');
    expect(result).toEqual([{"tag":"hello","attr":[{"key":"attr1","value":null}],"type":"TAG_OPEN"}]);

    result = parser.parse('<hello attr1>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:null}],type:"TAG_OPEN"}]);

    result = parser.parse('< hello attr1 >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:null}],type:"TAG_OPEN"}]);

    result = parser.parse('<\nhello attr1\n>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:null}],type:"TAG_OPEN"}]);
  });

  it("should handle attrubutes with empty value", function() {
    var result = parser.parse('<hello attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1 =>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1= >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1=    >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('< hello attr1=    >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);
  });

  it("should handle string double quotied attrubutes", function() {
    var result = parser.parse('<hello attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1 = "test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1 = "test\n">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test\n"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1=\t\n "test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello attr1=\t\n "test" \t\nattr2="test2">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test2"}],type:"TAG_OPEN"}]);
  });

  it("should handle string single quotied attrubutes", function() {
    var result = parser.parse("<hello attr1='test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse("<hello attr1 = 'test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse("<hello attr1\t =\t 'test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
  });

  it("should return data all attraibut names", function() {
    var result = parser.parse('<hello data-attr1>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:null}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello data-attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello data-attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello data-attr1 = "">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:""}],type:"TAG_OPEN"}]);
  });

  it("should handle number and dot attraibut names", function() {

    var result = parser.parse('<hello d0._attr1>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:null}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello d0._attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:""}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello d0._attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse('<hello d0._attr1 = "">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:""}],type:"TAG_OPEN"}]);
  });

  it("should handle multiple attrubutes", function() {
    var result = parser.parse("<hello attr1='test' attr2='test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse("<hello attr1='test' attr2=test>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"}],type:"TAG_OPEN"}]);

    result = parser.parse("<hello attr1='test' attr2=test attr3-foo>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"},{key:"attr3-foo",value:null}],type:"TAG_OPEN"}]);
  });

  it("should handle string rand quotied in attrubute list", function() {
    var result = parser.parse("<hello attr1='test' t'>");
    expect(result).toEqual([{"tag":"hello","attr":[{"key":"attr1","value":"test"},{"key":"t","value":null},{}],"type":"TAG_OPEN"}]);

    result = parser.parse("<hello attr1='test' t'sdfs dddd='DDD'>");
    expect(result).toEqual([{"tag":"hello","attr":[{"key":"attr1","value":"test"},{"key":"t","value":null},{},{"key":"sdfs","value":null},{"key":"dddd","value":"DDD"}],"type":"TAG_OPEN"}]);

    result = parser.parse("<hello attr1='test' t\"sdfs dddd='DDD'>");
    expect(result).toEqual([{"tag":"hello","attr":[{"key":"attr1","value":"test"},{"key":"t","value":null},{},{"key":"sdfs","value":null},{"key":"dddd","value":"DDD"}],"type":"TAG_OPEN"}]);

    result = parser.parse("<hello '>");
    expect(result).toEqual([{"tag":"hello","attr":[{}],"type":"TAG_OPEN"}]);
  });

  it("should handle self closing tags with attributes", function() {
    var result = parser.parse("<hello attr1='test'/>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_SELF_CLOSING"}]);
  });

  it("should handle self closing tags", function() {
    var result = parser.parse("<hello />");
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}]);

    result = parser.parse("<hello/>");
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}]);

    result = parser.parse("<hello / >");
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}]);
  });

  it("should handle end tags", function() {
    var result = parser.parse("</hello>");
    expect(result).toEqual([{tag:"hello", attr:null, type:"TAG_CLOSE"}]);

    result = parser.parse("</hello >");
    expect(result).toEqual([{tag:"hello", attr:null, type:"TAG_CLOSE"}]);

    result = parser.parse("</ hello >");
    expect(result).toEqual([{tag:"hello", attr:null, type:"TAG_CLOSE"}]);
  });

  it("should handle non parse tags", function() {
    var result = parser.parse("<script src=\"uri\"/>");
    expect(result).toEqual([{"tag":"script","type": "NON_PARSE_TAGS","attr":[{"key":"src","value":"uri"}],"type":"TAG_SELF_CLOSING"}]);

    var result = parser.parse("<script src=\"uri\"></script>");
    expect(result).toEqual([{"tag":"script","type": "NON_PARSE_TAGS","attr":[{"key":"src","value":"uri"}],"text":"","end":{"tag":"script","attr":[],"type":"TAG_CLOSE"}}]);

    var result = parser.parse("<script src=\"uri\"><p><span></span></p></script>");
    expect(result).toEqual([{"tag":"script","type": "NON_PARSE_TAGS","attr":[{"key":"src","value":"uri"}],"text":"<p><span></span></p>","end":{"tag":"script","attr":[],"type":"TAG_CLOSE"}}]);
  });

  it("should handle comments", function() {
    var result = parser.parse("<!-- -->");
    expect(result).toEqual([{type:"COMMENT",value:" "}]);

    result = parser.parse("<!-- \nx-->");
    expect(result).toEqual([{type:"COMMENT",value:" \nx"}]);

    result = parser.parse("<!-- \n <!-- dddd--> x-->");
    expect(result).toEqual([{type:"COMMENT",value:" \n <!-- dddd"}," x-->"]);

    result = parser.parse('<!-- --> xxx<p class=""> -->');
    expect(result).toEqual([{type:"COMMENT",value:" "}," xxx",{tag:"p", attr:[{key:"class",value:""}],type:"TAG_OPEN"}," -->"]);

    result = parser.parse("<!---->");
    expect(result).toEqual([{type:"COMMENT",value:""}]);

    result = parser.parse("<!-- foo -- -->");
    expect(result).toEqual([{type:"COMMENT",value:" foo -- "}]);

    result = parser.parse("<!-- foo ---->");
    expect(result).toEqual([{type:"COMMENT",value:" foo --"}]);

    result = parser.parse("<!---- foo -->");
    expect(result).toEqual([{type:"COMMENT",value:"-- foo "}]);
  });

  // TODO: need to support comments inside tags
  /*
  it("should handle comments in attributes", function() {
    var result = parser.parse("<a href='A<!-- foo -->B'>");
    console.log(JSON.stringify(result))
    expect(result).toEqual([{type:"COMMENT",value:" "}])

    result = parser.parse("<a <!-- foo --> href='AB'>");
    console.log(JSON.stringify(result))
    expect(result).toEqual([{type:"COMMENT",value:" \nx"}])
  });
  */

  // TODO: need to build test for XML, CDATA, etc.
  /*
  it("should handle XML", function() {
    var result = parser.parse("<?XML ffff xxxx\n?>");
    console.log(JSON.stringify(result))
    //expect(result).toEqual([{type:"COMMENT",value:" "}])
  });

  it("should handle comments", function() {
    var result = parser.parse("<!DOCTYPE>");
    expect(result).toEqual([{type:"COMMENT",value:" "}])
  });

  it("should handle comments", function() {
    var result = parser.parse("<CDATA[[]]>");
    expect(result).toEqual([{type:"COMMENT",value:" "}])
  });
  */

  it("should handle big messy makrup file", function() {
    var input = fs.readFileSync('./test/fixture/messy-markup.html').toString();
    var output = JSON.parse(fs.readFileSync('./test/fixture/messy-markup.json').toString());
    var start = new Date();
    var result = parser.parse(input);
    var end = new Date() - start;
    if(end > 100) {
      throw new Error('The parser is to slow!');
    }

    expect(result).toEqual(output);
  });


});
