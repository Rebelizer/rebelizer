// TODO: rename file to DOMTree
// DOMTree.parse()

var fs = require('fs')
  , path = require('path')
  , PEG = require('pegjs')
  , tokenizerPath = path.resolve(__dirname, '../peg/html-tokenizer.peg');

var selfClosingTags = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr']
  , formTags = ['input','option','optgroup','select','button','datalist','textarea']
  , createOrphanTags = ['p']
  , autoCloseTags = {
      tr      : ['tr', 'th', 'td'],
      th      : ['th'],
      td      : ['thead', 'td'],
      body    : ['head', 'link', 'script'],
      li      : ['li'],
      p       : ['p'],
      select  : formTags,
      input   : formTags,
      output  : formTags,
      button  : formTags,
      datalist: formTags,
      textarea: formTags,
      option  : ['option'],
      optgroup: ['optgroup']
    }
  , defaultXHTML = {
    selfClosingTags: selfClosingTags,
    createOrphanTags: createOrphanTags,
    autoCloseTags: autoCloseTags,
    caseSensitive: false
  };

const TAG_OPEN = 'TAG_OPEN'
  , TAG_CLOSE = 'TAG_CLOSE'
  , TAG_SELF_CLOSING = 'TAG_SELF_CLOSING'
  , COMMENT = 'COMMENT'
  , DEFAULT_XHTML_CONFIG = 'DEFAULT_XHTML';

/**
 * build a DOM tree using a list of nodes returned by the tokenizer.
 *
 * the way caseSensitive works is it lowerCase the tags but you have to make sure default tags are all lowercase to match
 *
 * @param nodes
 * @param config
 * @returns {{}}
 */
function buildTree(nodes, config) {
  var index
    , tagName
    , openImpliesCloseKeys
    , treeHeight
    , root= {}
    , cursor = root
    , caseSensitive = false
    , stack = []
    , cursorStack = [];

  if(config) {
    if(config === DEFAULT_XHTML_CONFIG) {
      config = defaultXHTML;
    }

    if(!config.selfClosingTags || !config.createOrphanTags || !config.autoCloseTags) {
      throw new Error("Config requires all selfClosingTags, createOrphanTags, and autoCloseTags defined.")
    }

    caseSensitive = config.caseSensitive;

    openImpliesCloseKeys = Object.keys(config.autoCloseTags);
  }

  for(var i in nodes) {
    var node = nodes[i];

    if(node.tag && !caseSensitive) {
      tagName = node.tag.toLowerCase();
    } else {
      tagName = node.tag;
    }

    if(!cursor) {
      if(config && config.strictXML) {
        throw new Error("Can not find parent node. Unbalanced open/close tags in tree.");
      }

      cursor = root;
    }

    if(typeof(node) === 'object') {
      switch(node.type) {
        case TAG_OPEN:
          if(config) {
            // ignore all children of self closing tags
            if(config.selfClosingTags.indexOf(tagName) != -1) {
              node.type = TAG_SELF_CLOSING;

              if(!cursor.children) {cursor.children = [node];}
              else {cursor.children.push(node);}

              break;
            }

            // walk up the stack closing all tags that are in the autoCloseTags list
            if(openImpliesCloseKeys.indexOf(tagName) != -1) {
              closeTags = config.autoCloseTags[tagName];

              treeHeight = index = stack.length;
              while(treeHeight--) {
                if(closeTags.indexOf(stack[treeHeight]) != -1) {
                  index = treeHeight;
                }
              }

              if(stack.length > index) {
                stack = stack.slice(0, index);
                cursorStack = cursorStack.slice(0, index);

                cursor = cursorStack[cursorStack.length-1];
                if(!cursor) {
                  cursor = root;
                }
              }
            }
          }

          if(!cursor.children) {cursor.children = [node];}
          else {cursor.children.push(node);}

          cursorStack.push(cursor = node);
          stack.push(tagName);

          break;
        case TAG_CLOSE:
          if(config) {
            // do not add the close tag of self closing tags i.e. <img src=""></img>
            // should only have one node img and ingore the </img> tag
            if(config.selfClosingTags.indexOf(tagName) != -1) {
              break;
            }
          }

          // if closing tag in the stack, close the children. If closing tag
          // not in the stack, ignore the tag or create an empty open tag use
          // the config option (createOrphanTags)
          if(stack.length && tagName != stack[stack.length-1]) {
            if((index = stack.indexOf(tagName)) !== -1) {
              index = stack.length - index;
              while(index--) {
                stack.pop();
                cursorStack.pop();
                cursor = cursorStack[cursorStack.length-1];
              }
            } else if(!config || (config.createOrphanTags && config.createOrphanTags.indexOf(tagName) != -1)) {
              node.type = TAG_OPEN;
              if(!cursor.children) {cursor.children = [node];}
              else {cursor.children.push(node);}
            }
          } else {
            // all root level orphan closing tags will be closed using config option (createOrphanTags)
            if(!stack.length && (!config || (config.createOrphanTags && config.createOrphanTags.indexOf(tagName) != -1))) {
              node.type = TAG_OPEN;
              if(!cursor.children) {cursor.children = [node];}
              else {cursor.children.push(node);}
              break;
            }

            stack.pop();
            cursorStack.pop();
            cursor = cursorStack[cursorStack.length-1];
          }
          break;
        case TAG_SELF_CLOSING:
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

  return root;
}

function tokenizer(nonParseTags, next) {
  fs.readFile(tokenizerPath, 'utf8', function (err, peg) {
    if(err) {
      next(err);
      return;
    }

    if(!nonParseTags) {nonParseTags = [];}
    if(nonParseTags.indexOf('script') === -1) {
      nonParseTags.push('script');
    }

    tagList = [];
    for(var i in nonParseTags) {
      tagList.push('"' + nonParseTags[i] + '"i');
    }

    peg += 'NON_PARSE_TAGS = ' + tagList.join(' / ');

    try {
      next(null, PEG.buildParser(peg));
    } catch(ex) {
      next(ex);
    }
  });
}

function stringifyAttr(list) {
  var string = '';

  if(list) {
    var lastAttr = list.length - 1;
    for(var i in list) {
      var attr = list[i];
      if(attr.value) {
        string += attr.key + '="' + attr.value + '"';
      } else {
        string += attr.key;
      }
      if(lastAttr > i) {
        string += ' ';
      }
    }
  }

  return string;
}

function stringify(node) {
  var line = '';

  if(typeof(node) == 'string') {
    line += node;
  } else {
    var attr = stringifyAttr(node.attr);
    if(attr !== '') {attr = ' ' + attr;}

    if(node.type === TAG_SELF_CLOSING) {
      line += '<' + node.tag + attr + '/>';
    } else if(node.type === COMMENT) {
      line += '<!--' + node.value + '-->';
    } else if(node.type === TAG_OPEN) {
      line += '<' + node.tag + attr + '>';

      if(node.children) {
        for(var i in node.children) {
          var nextNode = node.children[i];
          line += stringify(nextNode);
        }
      }

      line += '</' + node.tag + '>';
    } else if(node.children) {
      for(var i in node.children) {
        var nextNode = node.children[i];
        line += stringify(nextNode);
      }
    }
  }

  return line;
}

module.exports = exports = function() {

};

exports.TAG_OPEN = TAG_OPEN;
exports.TAG_CLOSE = TAG_CLOSE;
exports.TAG_SELF_CLOSING = TAG_SELF_CLOSING;
exports.COMMENT = COMMENT;
exports.DEFAULT_XHTML_CONFIG = DEFAULT_XHTML_CONFIG;

exports.buildTree = buildTree;
exports.stringify = stringify;
exports.tokenizer = tokenizer;
