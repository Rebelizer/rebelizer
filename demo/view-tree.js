(function() {

  /*
   * simple render tree
   */
  function renderCompiler(parent, config) {
    if(!config) config = {};
    this.parent = parent || null;
    this.children = config.c || [];
    this.dirty = false;

    this.plugins = {};
    this.scope = config.s || {};

    this.watchList = config.w || [];
    this.watch = new watch(this);
    this.id = 0;
  }

  renderCompiler.prototype.openTag = function(tag, attr, selfClosing) {
    var line = '<' + tag;

    if(attr) {
      for(i = 0, length = attr.length; i < length; i++) {
        attr = attr[i];
        line += ' ' + attr.key + '="' + attr.value + '"';
      }
    }
    if(selfClosing === true) {
      line += '/>';
    } else {
      line += '>';
    }

    this.children.push(line);
  }

  renderCompiler.prototype.write = function(str) {
    this.children.push(str);
  }

  renderCompiler.prototype.custom = function(name, config) {
    if(!name) throw new Error('You need to have a name');
    this.children.push({type:name, config:config});
  }

  renderCompiler.prototype.closeTag = function(tag) {
    this.children.push('</'+tag+'>');
  }

  renderCompiler.prototype.render = function() {
    var markup = [];
    for(var el, i = 0, max = this.children.length; i<max; i++) {
      el = this.children[i];
      if(typeof el === 'string') {markup.push(el);}
      else if(typeof el === 'object') {
        // use the DI magic to so amazing things
        // for testing hard code shit
        if(el.type == 'rebelizer') {
          markup.push('<script>'+require('fs').readFileSync(require('path').resolve(__dirname, './view-tree.js')).toString().replace(/script/g, 'srp') + '</script>');
          markup.push('<script>'+require('fs').readFileSync(require('path').resolve(__dirname, './demo-widget.js')).toString() + '</script>');
        } else if(el.type == 'demoWidget') {
          markup.push(this.plugins['demoWidget'].renderIt(this));
        }
      }
    }

    markup.push('<script>var renderTREE = new window.rebelizer.renderCompiler(null, ' + this.compile().replace(/script/g, 'srp') + '); renderTREE.loadWatchers();</script>')
    markup.push('<script>setInterval(function() {renderTREE.watch.scan();}, 200)</script>')

    return markup.join('');
  }

  renderCompiler.prototype.compile = function() {
    // this will build a client side version of this
    return JSON.stringify({c:this.children, w:this.watchList, s:this.scope});
  }

  renderCompiler.prototype.boundTo = function(expr) {
    this.watchList.push(expr);
  }

  renderCompiler.prototype.loadWatchers = function() {
    var watchList = this.watchList;
    var self = this;
    for(var i in watchList) {
      this.watch.onChange(watchList[i], function() {
        setTimeout(function() {
          // hard coded for testing but when we have nested render tree nodes we can taget only the change
          $('[data-rid='+self.id+ ']').replaceWith(self.plugins['demoWidget'].renderIt(self));
          self.plugins['demoWidget'].demoEvent(self);
        }, 0);
      });
    }

  }

  /* ============================================== */

  var RESCAN = {};

  function expressionFn(expr) {
    var type = typeof(expr);

    if(type === 'function') return expr;
    else if(type ==='string') {
      return eval('(function($scope) {return ' + expr + ';})');
    }

    throw new Error('Unknown watch expiration');
  }

  /* copy of the watch code */
  function watch(target, maxRetries) {
    this.target = target;

    this.maxRetries = maxRetries || 4;
    this.dirty = false;

    this.parent = null;
    this.observers = [];
  }

  watch.prototype = {
    onChange: function(expr, fn, useEqualityTest) {
      var exprFn = expressionFn(expr);

      var observe = {
        fn: fn,
        last: exprFn(this.target),
        value: exprFn,
        eqTest: !!useEqualityTest
      };

      this.observers.unshift(observe);

      return this;
    },

    scan: function() {
      var observe, value, last, i, rescan
        , retryCount = this.maxRetries;

      do {
        i = this.observers.length;
        rescan = false;

        while(i--) {
          observe = this.observers[i];
          //console.log(i, this.target, observe.value, '|',observe.value(this.target))
          if((value = observe.value(this.target)) !== (last = observe.last)) {
            this.dirty = true;
            observe.last = value;
            if(observe.fn(value, last, this) === RESCAN) {
              rescan = true;
            }
          }
        }
      } while(rescan && --retryCount > 0);

      if(rescan && retryCount <= 0) {
        throw new Error('Maxed out on the scan')
      }

      return this.dirty;
    },

    branch: function() {

    }
  }

  if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
    module.exports.renderCompiler = renderCompiler;
    module.exports.watch = watch;
    module.exports.RESCAN = RESCAN;
  } else {
    window.rebelizer = window.rebelizer || {}
    window.rebelizer.renderCompiler = renderCompiler;
    window.rebelizer.watch = watch;
    window.rebelizer.RESCAN = RESCAN;
  }


})();
