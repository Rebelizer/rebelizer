var fs = require('fs')
  , path = require('path')
  , filePath = path.resolve(__dirname, './input.html')
  , http = require('http')
  , DOMTree = require('../lib/dom-tree')
  , renderCompiler = require('./view-tree').renderCompiler
  , watch = require('./view-tree').watch
  , demoWidget = require('./demo-widget')
  , qs = require('querystring')

/*
 * create a web server that will parser the input.html file and server it out
 */
DOMTree.tokenizer(['demoWidget'], function(err, tokenizer) {
  http.createServer(function (req, res) {
    var nodes = tokenizer.parse(fs.readFileSync(filePath).toString());
    var tree = DOMTree.buildTree(nodes, DOMTree.DEFAULT_XHTML_CONFIG);

    var queryPart = req.url.split('?')[1];
    queryPart = qs.parse(queryPart);

    var page = walkTree(tree);
    page.scope = {
      offset:(queryPart && parseInt(queryPart.offset,10)) || 0,
      items:["A","B","C","D","E","F","G","H","J"]
    };

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(page.render());
  }).listen(3000, '127.0.0.1');
});

/*
 * util function to walk the parsered DOM and build up a render tree
 */
function walkTree(node, renderNode) {
  var i, attr, length;

  if(!renderNode) {
    renderNode = new renderCompiler();
    renderNode.plugins.demoWidget = demoWidget;
  }

  if(node.tag && (['demo-widget','rebelizer'].indexOf(node.tag.toLowerCase()) != -1)) {
    // check if the tag need to get processed

    if(node.tag.toLowerCase() == 'rebelizer') {
      renderNode.custom('rebelizer', {});
    } else if(node.tag.toLowerCase() == 'demo-widget') {
      renderNode.custom('demoWidget', {markup:node.children});
    }

    return renderNode;
  } else if(node.tag) {
    renderNode.openTag(node.tag, node.attr, node.type == 'TAG_SELF_CLOSING');
  } else {
    if(typeof node === 'string') {
      renderNode.write(node);
    } else {
      // this is a process inst or something else!
    }
  }

  if(node.children) {
    for(i = 0, length = node.children.length; i < length; i++) {
      walkTree(node.children[i], renderNode);
    }
  }

  if(node.tag && node.type != 'TAG_SELF_CLOSING') {
    renderNode.closeTag(node.tag);
  }

  return renderNode;
}
