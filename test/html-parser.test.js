require('expectations');

var fs = require('fs')
  , path = require('path')
  , PEG = require('pegjs')
  , DOMTree = require('../lib/dom-tree')
  , tokenizerPath = path.resolve(__dirname, '../peg/html-tokenizer.peg');

describe('html tokenizer', function() {

  var tokenizer;

  before(function(done){

    fs.readFile(tokenizerPath, 'utf8', function (err, data) {
      if(err) {
        return done(err);
      }

      data += 'NON_PARSE_TAGS = "script"i / "jade"i';

      tokenizer = PEG.buildParser(data);

      done();
    });
  });

  it("should parse empty string", function() {
    var nodes = tokenizer.parse('<img src="/foobar.png">');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"img","attr":[{"key":"src","value":"/foobar.png"}],"type":"TAG_SELF_CLOSING"}]});
  });
});
