var fs = require('fs')
  , path = require('path')
  , PEG = require('pegjs')
  , tokenizerPath = path.resolve(__dirname, '../peg/html-tokenizer.peg');

const TAG_OPEN = 'TAG_OPEN',
  TAG_CLOSE = 'TAG_CLOSE',
  TAG_SELF_CLOSING = 'TAG_SELF_CLOSING',
  COMMENT = 'COMMENT';

var formTags = {
  input: true,
  option: true,
  optgroup: true,
  select: true,
  button: true,
  datalist: true,
  textarea: true
};

var openImpliesClose = {
  tr      : { tr:true, th:true, td:true },
  th      : { th:true },
  td      : { thead:true, td:true },
  body    : { head:true, link:true, script:true },
  li      : { li:true },
  p       : { p:true },
  select  : formTags,
  input   : formTags,
  output  : formTags,
  button  : formTags,
  datalist: formTags,
  textarea: formTags,
  option  : { option:true },
  optgroup: { optgroup:true }
};

var selfClosingTags = {
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  link: true,
  meta: true,
  param: true,
  embed: true,
  command: true,
  keygen: true,
  source: true,
  track: true,
  wbr: true
};

function buildDOMTree(nodes, strictMode, selfClosingTags, openImpliesClose) {
  var index, root= {}, cursor = root, stack = [], cursorStack = [];

  for(var i in nodes) {
    var node = nodes[i];

    // make sure all the nodes names are lower case
    if(!strictMode && node.tag) {
      node.tag = node.tag.toLowerCase();
    }

    if(!cursor) {
      if(strictMode) {
        throw new Error("Can not find parent node. Unbalanced open/close tags in tree.");
      }

      cursor = root;
    }

    if(typeof(node) === 'object') {
      switch(node.type) {
        case TAG_OPEN:
          if(strictMode) {
            // ignore all children of self closing tags
            if(node.tag in selfClosingTags) {
              break;
            }
          /*
           if(true && node.tag in openImpliesClose) {
           closeTags = openImpliesClose[node.tag]
           while(stack[stack.length-1] in closeTags) {
           stack.pop();
           cursorStack.pop();
           cursor = cursorStack[cursorStack.length-1];
           }

           if(!cursor) cursor = root;
           }*/
          }

          if(!cursor.children) {cursor.children = [node];}
          else {cursor.children.push(node);}

          cursorStack.push(cursor = node);
          stack.push(node.tag);

          break;
        case TAG_CLOSE:
          if(!strictMode) {

            // ignore self closing tags
            if(node.tag in selfClosingTags) {
              break;
            }

            // if unmatched tag create an empty place holder for it
            // and walk back to the matching tag
            if(stack.length && node.tag != stack[stack.length-1]) {
              if((index = stack.indexOf(node.tag)) !== -1) {
                index = stack.length - index;
                while(index--) {
                  stack.pop();
                  cursorStack.pop();
                  cursor = cursorStack[cursorStack.length-1];
                }
              } else {
                node.type = TAG_OPEN;
                if(!cursor.children) {cursor.children = [node];}
                else {cursor.children.push(node);}
              }
            } else {
              stack.pop();
              cursorStack.pop();
              cursor = cursorStack[cursorStack.length-1];
            }
          } else {
            stack.pop();
            cursorStack.pop();
            cursor = cursorStack[cursorStack.length-1];
          }
          break;
        default:

          if(!cursor.children) {cursor.children = [node];}
          else {cursor.children.push(node);}

          break;
      }
    } else {
      if(!cursor.children) {cursor.children = [node];}
      else {cursor.children.push(node);}
    }
  }

  //console.log(JSON.stringify(root, null, 2))
  return root;
}


//module.exports = Parser;


fs.readFile(tokenizerPath, 'utf8', function (err, data) {
  data += 'NON_PARSE_TAGS = "script"i / "jade"i';

  var parser = PEG.buildParser(data);

  // <body> <p> <div> xxx</p></div></body>
  // <body> <p> </div><div> xxx</p></div></body>

  var output = parser.parse(fs.readFileSync('/tmp/eee.html').toString());
//  var output = parser.parse('<body><p><div></p></div></body>');
//  var output = parser.parse('<html><body><p>START<div>main</div>END</p></body></html>');
//  var output = parser.parse('<html><p>A <p>foo</p> </p><p>B<!-- foo me --></p><wow rr="DD"/>pppp</html>');
//  var output = parser.parse(fs.readFileSync('/tmp/foo/htmlparser2/tests/index.html--').toString())
  //console.log(output);

  var r = buildDOMTree(output, false, selfClosingTags, openImpliesClose);
  console.log(JSON.stringify(r, null,2));
  console.log(makeHTML(r));//.replace('<div></div>',''));
});

function makeHTML(node) {

  var out = '';
  if(node.tag) {out += "<"+node.tag+">";}
  if(node.children) {
    for(var i in node.children) {
      out+= makeHTML(node.children[i]);
    }
  }
  if(node.tag) {out+= "</"+node.tag+">";}
  return out;
}
