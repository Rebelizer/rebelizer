require('expectations');

var DOMTree = require('../lib/dom-tree');

describe('html tokenizer', function() {

  var tokenizer;

  before(function(done){

    DOMTree.tokenizer(false, function(err, tok) {
      tokenizer = tok;
      done();
    });

  });

  it("should build basic balanced tree", function() {
    var nodes = tokenizer.parse('<html></html>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({ children: [ { tag: 'html', attr: null, type: 'TAG_OPEN' } ] });

    nodes = tokenizer.parse('<html><head></head><div><h1></h1></div><footer><p></p></footer></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN","children":[{"tag":"head","attr":null,"type":"TAG_OPEN"},{"tag":"div","attr":null,"type":"TAG_OPEN","children":[{"tag":"h1","attr":null,"type":"TAG_OPEN"}]},{"tag":"footer","attr":null,"type":"TAG_OPEN","children":[{"tag":"p","attr":null,"type":"TAG_OPEN"}]}]}]});

    nodes = tokenizer.parse('<html><header></header><footer></footer></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN","children":[{"tag":"header","attr":null,"type":"TAG_OPEN"},{"tag":"footer","attr":null,"type":"TAG_OPEN"}]}]});
  });

  it("should allow multi elements in root node", function() {
    var nodes = tokenizer.parse('<html></html><html></html>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({ children: [ { tag: 'html', attr: null, type: 'TAG_OPEN' }, { tag: 'html', attr: null, type: 'TAG_OPEN' } ] });
  });

  it("should ignore missing open tags if not in createOrphanTags", function() {
    var nodes = tokenizer.parse('</head>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({});

    nodes = tokenizer.parse('<html></head></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN"}]})

    nodes = tokenizer.parse('<html></html></head>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN"}]})

    nodes = tokenizer.parse('<html></head></div></foo></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN"}]})
  });


  it("should create missing open tags", function() {
    var nodes = tokenizer.parse('</p>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":null,"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<html></p></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN","children":[{"tag":"p","attr":null,"type":"TAG_OPEN"}]}]});

    nodes = tokenizer.parse('<html></html></p>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN"},{"tag":"p","attr":null,"type":"TAG_OPEN"}]});
  });

  it("should create missing open tags for all elements if no config passed", function() {
    var nodes = tokenizer.parse('</head>');
    var tree = DOMTree.buildTree(nodes);
    expect(tree).toEqual({"children":[{"tag":"head","attr":null,"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('</foobar>');
    tree = DOMTree.buildTree(nodes);
    expect(tree).toEqual({"children":[{"tag":"foobar","attr":null,"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<html></foobar></html>');
    tree = DOMTree.buildTree(nodes);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN","children":[{"tag":"foobar","attr":null,"type":"TAG_OPEN"}]}]});
  });

  it("should parser out attributes", function() {
    var nodes = tokenizer.parse('<p test>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":null}],"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<p test test2>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":null},{"key":"test2","value":null}],"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<p test=1>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":"1"}],"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<p test= 1>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":"1"}],"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<p test= abc>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":"abc"}],"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<p test= abc test2= 123>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":[{"key":"test","value":"abc"},{"key":"test2","value":"123"}],"type":"TAG_OPEN"}]});
  });

  it("should handle self closing tags", function() {
    var nodes = tokenizer.parse('<html><br><br/></br></html>'); // <html><br></br>
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"html","attr":null,"type":"TAG_OPEN","children":[{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"},{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"}]}]});

    nodes = tokenizer.parse('<br><br/></br>'); // <html><br></br>
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"},{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"}]});

    nodes = tokenizer.parse('<br></br><br/>'); // <html><br></br>
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"},{"tag":"br","attr":null,"type":"TAG_SELF_CLOSING"}]});

    nodes = tokenizer.parse('</br>'); // <html><br></br>
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({});

    nodes = tokenizer.parse('<br/>'); // <html><br></br>
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({ children: [ { tag: 'br', attr: null, type: 'TAG_SELF_CLOSING' } ] });
  });

  it("should convert self closing tags to TAG_SELF_CLOSING", function() {
    var nodes = tokenizer.parse('<br>'); // <html><br></br>
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({ children: [ { tag: 'br', attr: null, type: 'TAG_SELF_CLOSING' } ] });
  });


  it("should automatically close tags", function() {
    var nodes = tokenizer.parse('<p>A<p>B</p>C</p>');
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"p","attr":null,"type":"TAG_OPEN","children":["A"]},{"tag":"p","attr":null,"type":"TAG_OPEN","children":["B"]},"C",{"tag":"p","attr":null,"type":"TAG_OPEN"}]});

    nodes = tokenizer.parse('<tr><td>A</td><td>B</td><tr><td>C</td></tr>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    expect(tree).toEqual({"children":[{"tag":"tr","attr":null,"type":"TAG_OPEN","children":[{"tag":"td","attr":null,"type":"TAG_OPEN","children":["A"]},{"tag":"td","attr":null,"type":"TAG_OPEN","children":["B"]}]},{"tag":"tr","attr":null,"type":"TAG_OPEN","children":[{"tag":"td","attr":null,"type":"TAG_OPEN","children":["C"]}]}]});
  });

  /*it("should stringify ", function() {
    var tree = {"children":[{"tag":"p","attr":null,"type":"TAG_OPEN","children":["A"]},{"tag":"p","attr":null,"type":"TAG_OPEN","children":["B"]},"C",{"tag":"p","attr":null,"type":"TAG_OPEN"}]}

    nodes = tokenizer.parse('<html><head></head><body><h1>TITLE</h1><h2>page information</h2></body></html>');
    tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);
    var str = DOMTree.stringify(tree);
    expect(str).toEqual('<html><head></head><body><h1>TITLE</h1><h2>page information</h2></body></html>');
  });*/

});
