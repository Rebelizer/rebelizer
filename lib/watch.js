
var fs = require('fs')
  , path = require('path')
  , PEG = require('pegjs')
  , jsExpressionPath = path.resolve(__dirname, '../peg/js-expression.peg')
  , parser = false;

function expressionFn(expr) {

  if(!parser) {
    try {
      parser = PEG.buildParser(fs.readFileSync(jsExpressionPath, 'utf8')).parse;
    } catch(e) {
      throw new Error('Can not build expression parser.')
    }
  }

  var type = typeof(expr);

  if(type === 'function') return expr;
  else if(type ==='string') {
    var config = parser(expr);
    return eval('(function($scope) {' + config.verables + ';return ' + config.code + ';})');
  }

  throw new Error('Unknown watch expiration');
}

function watch(target, maxRetries) {
  this.target = target;

  this.maxRetries = maxRetries || 4;
  this.dirty = false;

  this.parent = null;
  this.observers = [];
}

/**
 * @param fn this can be null/false/undefined if just a dirty check
 *
 * @type {{onChange: Function, scan: Function, branch: Function}}
 */
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
        if((value = observe.value(this.target)) !== (last = observe.last)) {
          this.dirty = true;
          observe.last = value;
          if(observe.fn(value, last, this) === exports.RESCAN) {
            rescan = true;
          }
        }
      }
    } while(rescan && --retryCount > 0);

    console.log(rescan, retryCount)
    if(rescan && retryCount <= 0) {
      throw new Error('Maxed out on the scan')
    }

    return this.dirty;
  },

  branch: function() {

  }


}



exports = module.exports = watch;

exports.RESCAN = {};





/*
function scope() {
  this._meta = {
    parent: null,
    children: [],
    watchers:[]
  }
}

scope.prototype = {
  observe: function(expr, fn, useEqualityTest) {
    var exprFn = expressionFn(expr);

    var watch = {
      fn: fn,
      last: exprFn(this),
      value: exprFn,
      eqTest: !!useEqualityTest
    };

    this._meta.watchers.unshift(watch);
  },

  scan: function() {
    var watch
      , dirty
      , value
      , last
      , i = this._meta.watchers.length;

    while(i--) {
      watch = this._meta.watchers[i];
      if((value = watch.value(this)) !== (last = watch.last)) {
        dirty = true;
        watch.last = value;
        watch.fn(value, last);
      }
    }
  },

  branch: function() {
    var scopeTemp = function() {};
    scopeTemp.prototype = this;
    var scope = new scopeTemp();

    scope._meta = {
      parent: null,
      children: [],
      watchers:[]
    }

    this._meta.children.push(scope);

    return scope;
  }
}

var ROOT = new scope();
var A = ROOT.branch();
var B = ROOT.branch();
var B1 = B.branch();

ROOT.info = {name:"BOB", age:123};
B1.info.name = "SAM";

console.log(ROOT.info);
console.log(B1.info);

var ROOT = new scope();
ROOT.info = {name:"BOB", age:123};
var A = ROOT.branch();
var B = ROOT.branch();
var B1 = B.branch();

B1.info={ name:"SAM"};

console.log(ROOT.info);
console.log(B1.info);

B1.observe('$scope.info.name', function(old,newX) {console.log('name changed', old, '|', newX);})
B1.info.name="werwe";
B1.scan();
*/

/*
scope.name = xxx
scope.foobar = 123
scope.x = {a:1, b:2}
scope.abc = function() {}
*/

/*
var demi = new scope();

demi.watch('$scope.a', function() {console.log('a changed');})
demi.watch('$scope.b', function() {console.log('b changed (1)');})
demi.watch('$scope.b', function() {console.log('b changed (2)');})
demi.watch('$scope.a', function() {console.log('a changed with a change to b'); demi.b='nice';})

demi.digest();
demi.a = '123'
demi.digest();
*/


// observer 'a.b.c' if it changes then fire an event
// a -> b / b -> a we have a cycle die!

/*

if item changes only update the item
if the list changes update all block

<ul>
 <!-- line is a view -->
 <li><p><span>11.</span> foo</p></li>
 <!-- line is a view -->
 <li><p><span>11.</span> foo</p></li>
 <!-- line is a view -->
 <li><p><span>11.</span> foo</p></li>
</ul>


so the watchs are on a DOM tree to help use understand what needs to be rebuilt but


data = {name:'foo', age:123}

full render (data) -> what is sent out to the broswer
client side: (we get the data, or its wired down)

       SYNC
(data) <--> (data)
server      client

watch on both side and trigers (if data changes write that change in a diff) (with a rev)


how to do A/B testing
how to do tracking
how to do analitics
how to do workflow stuff

a great example is having stuff server side pushed to the client


each item in list
  hello {{item.name}}


list watch
  1 watch name
  2 watch name
  3 watch name
  4 watch name

if paging (only bind 4 of 100)


watch(1,2,3,4,list)

var x = {list:[1,2,3,4]}

x.list = [4,3,2,4]; watch 1,2,3,4 fire

watch (x.a, x.b, x.c) -> all file and go to undefined list would fire also because we would have something new {aa,bb}
var x = {list:{a:1, b:2, c:3}}
x.list = {aa:1,bb:22};

# so the order of watch mater because the watch list can cancel out the other watchers



MyTag -> controller (ask to get the $render -> tools to bind views)


google is equel function is good


===========


root scope
  a scope
  b scope
    b.1 scope
    b.2 scope


<b>
 <b1></b1>
 <b2 onclick="foome()"></b2>
</b>


(render will wire up b2.onclick -> b.2 scope -> b (controller)

fooCtrl($scope) {
$scope.foome = function xxx();
}


Think about taking the TREE -> building a scope/render object!
*/




/*

<html>
<head></head>
<body>
  <h1 class="">{{$scope.title}}</h1>
</body>
</html>

$render will build ->
var a1="<html><head></head><body>";
var a2 = function($scope, $domId) {return "<h1 x-id=\""+$docId+"\" class=\"\">" + $scope.title + "</h1>";}  /// this about using the $eval that allows stuff like a | filter
var a3="</body></html>";

$scope.$docId
$jsFoo = "$watch('$scope.title', fn(){$jQuery(x-id[1]).html( '')})"




 */

/*

 ---------------
 |             |
 |  C          |
 |       |-----|
 |---|   |B ___|
 | D |   |  | A|
 ---------------

D & A can change and only need to update A D
If B & A changed we only need to update B

Good example if you have a list of items (A) but you also have item count show in D & B
We will need to rerender D & B unless B as a 2 child


<div binding="$scope.list">
  <span binding="$scope.foobar"><span binding="$scope.wee">
</div>

list -> item(a), item(b), item(c)
 item(a) <- watch
 item(c) <- watch
 item(b) <- watch


{a:1, b:1}

watch(a) -> b++;     b=2
watch(a) -> b = 3;   b=3
watch(b) -> a++;     a=1

scope is just observer (read only) but you can change i.e. computed


very basic example
$scope = {a:1, b:1}

user clicks button fn->$scope.b++; fn->$scope.item.push({nice:'name'})
$digest is run
then we find out that in our graph we need to update a sub part of the graph
when item.length changes we need to rerender the list
 add "<p>foo</p>" --> that adds a watcher to scope ($scope.item[0].nice)    -> on change we want to get notified to get DOM el.html( new render output from $scope.item[0])
 add "<p>foo</p>" --> that adds a watcher to scope ($scope.item[0].nice)


 with click events on the $scope.clickMe  -> we want to have this as a prototype chain so that if not in the current scope it will keep moving up









 */

/*

VERY KEY IDEA!

we have a $render that handles all the rendering of the DOM tree. For the client side its smart and handles events, partial updates
but for the server side its just a one time pass.

We sync the data because the client and server. Use watchers to trigger sync. Use version to trigger syncs. Think about if we just send back diffs or full objects. or if we need the data sync (its an options)

scopes are overlays on data objects. This lets use control the render binding better.

its the same controller code on the client/server

the developer will explicitly add client side code. we will make it easy to send our service side code to the client. like component

------

parser the DOM (build a tree)
TRACK_USER tag -> will not use $render, but will add $clientSideJS, and will use $pipeline to log events
FORM tag -> will use $render, $tree to get config info and render, $pipeline to handle posts, $clientSideJS.addCOntroler, $css, $session to handle csrf

A/B tag -> will use $tree, pipeline to add cookie

INCLUDE/BLOCK/MIXIN tag -> will update the $tree



*/





/*
    A
  C   B
  D   E  F


  scan (single node)
  scan (only down)
  scan (all)
  scan (up)

  # dirty mark (this is what is used by the render

  <div> {{name}} {{page}} </div>  we have watch on name, page ---> watch is the div so we need to repaint div

  the tree should have a reset state so when we run a scan all we are doing is marking if its dirty or clean
  this will let us deside to delay repainting if we want. That way changes are not lost. Yes the watchers are
  always update to date but the clean/dirty state is just saved in the tree data.

  for DI we will the $scope -> this is just a javacsript object and $watch -> this is the tree stuff


  with pipeline config you can do:
  <requireSecurity session-key="sdfsdf" />
  <route find-all="/blog/:slug" />

  <blog foo="sweet config"> </blog>

  ------

  we need config to get request to a page
  this can be a JSON config
  it could be a directory of pages that are always loaded at lunch
  then this info could be updated post lunch

  this about this example:
     if you have a client side web app that need to have 3 routes  (blog page, about, contact)
     but each is a seperate page. How are you going to load the client side dynamicly but the
     server site will just render each one as a page! Its almost like the client side need to
     fetch the page on demaind and build it self up and be smart about the views.


  server-side example:

     Header
       Body
         VIEW MIXIN
     Footer

    on blog page => VIEW MIXIN (blog, or about, contact)

    blog, about, contact are all blocks not full pages/dom elements
    so the $render need to be super smart on the client-side to know
    that is does not need to rerender all the page... but only the
    block view!

 */
