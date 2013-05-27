require('expectations');

var util = require('util')
  , fs = require('fs')
  , pegjs = require('pegjs')

describe('html tokenizer', function() {

  var parser;

  before(function(done){

    parser = pegjs.buildParser(fs.readFileSync('./peg/html-tokenizer.peg').toString());
    done();
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
/*
  it("should handle attrubutes with out values", function() {
    var result = parser.parse('<  hello attr1>');
    console.log(JSON.stringify(result))
    //expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:null}],type:"TAG_OPEN"}]);

  });
*/

  it("should handle attrubutes with out values", function() {
    var result = parser.parse('<hello attr1>');
    //console.log(JSON.stringify(result))
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:null}],type:"TAG_OPEN"}]);

  });

  it("should handle attrubutes with empty value", function() {
    var result = parser.parse('<hello attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello attr1 =>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello attr1= >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello attr1=    >');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:""}],type:"TAG_OPEN"}]);

  });

  it("should handle string double quotied attrubutes", function() {
    var result = parser.parse('<hello attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello attr1 = "test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello attr1=\t\n "test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
  });

  it("should handle string single quotied attrubutes", function() {
    var result = parser.parse("<hello attr1='test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse("<hello attr1 = 'test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse("<hello attr1\t =\t 'test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
  });

  it("should return data all attraibut names", function() {
    var result = parser.parse('<hello data-attr1>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:null}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello data-attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello data-attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello data-attr1 = "">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"data-attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello d0._attr1>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:null}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello d0._attr1=>');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:""}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello d0._attr1="test">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse('<hello d0._attr1 = "">');
    expect(result).toEqual([{tag:"hello",attr:[{key:"d0._attr1",value:""}],type:"TAG_OPEN"}]);
  });

  it("should handle multiple attrubutes", function() {
    var result = parser.parse("<hello attr1='test' attr2='test'>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"}],type:"TAG_OPEN"}]);

    var result = parser.parse("<hello attr1='test' attr2=test>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"}],type:"TAG_OPEN"}])

    var result = parser.parse("<hello attr1='test' attr2=test attr3-foo>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"},{key:"attr2",value:"test"},{key:"attr3-foo",value:null}],type:"TAG_OPEN"}])
  });
/*
  it("should handle string single quotied attrubutes 6", function() {
    var result = parser.parse("<hello attr1='test' t'>");
    console.log(JSON.stringify(result))
    //expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_SELF_CLOSING"}])

  });
*/
  it("should handle self closing tags with attributes", function() {
    var result = parser.parse("<hello attr1='test'/>");
    expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_SELF_CLOSING"}]);
  });

  it("should handle self closing tags", function() {
    var result = parser.parse("<hello />");
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}])

    var result = parser.parse("<hello/>");
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}])
/*
    var result = parser.parse("<hello / >");
    console.log(JSON.stringify('!!!!!!', result))
    //expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
    expect(result).toEqual([{tag:"hello",attr:null,type:"TAG_SELF_CLOSING"}])
*/
  });

  it("should handle end tags", function() {
    var result = parser.parse("</hello>");
    expect(result).toEqual([{tag:"hello", attr:null, type:"TAG_CLOSE"}])

    var result = parser.parse("</hello >");
    expect(result).toEqual([{tag:"hello", attr:null, type:"TAG_CLOSE"}])
  });
/*
  it("should handle string single quotied attrubutes 11", function() {
    var result = parser.parse("</ hello >");
    console.log(JSON.stringify(result))
    //expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
    expect(result).toEqual([{type:"COMMENT",value:" \n <!-- dddd"}," x-->"])
  });

  it("should handle string single quotied attrubutes", function() {
    var result = parser.parse("</ hello too="xxx">");
    console.log(JSON.stringify(result))
    //expect(result).toEqual([{tag:"hello",attr:[{key:"attr1",value:"test"}],type:"TAG_OPEN"}]);
  });
*/



  it("should handle comments", function() {
    var result = parser.parse("<!-- -->");
    expect(result).toEqual([{type:"COMMENT",value:" "}])

    var result = parser.parse("<!-- \nx-->");
    expect(result).toEqual([{type:"COMMENT",value:" \nx"}])

    var result = parser.parse("<!-- \n <!-- dddd--> x-->");
    expect(result).toEqual([{type:"COMMENT",value:" \n <!-- dddd"}," x-->"])

    var result = parser.parse('<!-- --> xxx<p class=""> -->');
    expect(result).toEqual([{type:"COMMENT",value:" "}," xxx",{tag:"p", attr:[{key:"class",value:""}],type:"TAG_OPEN"}," -->"])

    var result = parser.parse("<!---->");
    expect(result).toEqual([{type:"COMMENT",value:""}])

    var result = parser.parse("<!-- foo -- -->");
    expect(result).toEqual([{type:"COMMENT",value:" foo -- "}])

    var result = parser.parse("<!-- foo ---->");
    expect(result).toEqual([{type:"COMMENT",value:" foo --"}])

    var result = parser.parse("<!---- foo -->");
    expect(result).toEqual([{type:"COMMENT",value:"-- foo "}])

    /*
    var result = parser.parse("<a href='' <!---- foo --> class=''/>test</a>");
    expect(result).toEqual([{type:"COMMENT",value:"-- foo "}])
    */
  });
/*
  it("should handle comments", function() {
    var result = parser.parse("<?XML ffff xxxx\n?>");
    expect(result).toEqual([{type:"COMMENT",value:" "}])
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

  it("should handle comments", function() {
    var input = fs.readFileSync('./test/fixture/messy-markup.html').toString()
    var output = JSON.parse(fs.readFileSync('./test/fixture/messy-markup.json').toString())
    var result = parser.parse(input);
    expect(result).toEqual(output)
  });


});
