var util = require('util');

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
  , FN_ARG_SPLIT = /,/
  , FN_ARG = /^\s*(_?)(\S+?)\1\s*$/
  , STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function assertArg(arg, name, reason) {
  if (!arg) {
    throw new Error("Argument '" + (name || '?') + "' is " + (reason || "required"));
  }
  return arg;
}

function assertArgFn(arg, name, acceptArrayAnnotation) {
  if (acceptArrayAnnotation && util.isArray(arg)) {
    arg = arg[arg.length - 1];
  }

  assertArg((typeof(arg) === 'function'), name, 'not a function, got ' +
    (arg && typeof(arg) === 'object' ? arg.constructor.name || 'Object' : typeof(arg)));
  return arg;
}

function annotate(fn) {
  var $inject, fnText, argDecl, last;

  if (typeof fn == 'function') {
    if (!($inject = fn.$inject)) {
      $inject = [];
      fnText = fn.toString().replace(STRIP_COMMENTS, '');
      argDecl = fnText.match(FN_ARGS);
      argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
        arg.replace(FN_ARG, function(all, underscore, name){
          $inject.push(name);
        });
      });
      fn.$inject = $inject;
    }
  } else if (util.isArray(fn)) {
    last = fn.length - 1;
    assertArgFn(fn[last], 'fn');
    $inject = fn.slice(0, last);
  } else {
    assertArgFn(fn, 'fn', true);
  }

  return $inject;
}

function createContainer() {
  var providers = {}
    , path = []
    , api = {};

  //function service(name, fn) {}
  //function decorator(name, fn) {}
  //function constant(name, fn) {}

  //function directive(name, fn) {}

  api.lazyInit = function(name, fn) {
    providers[name] = function() {
      return api.invoke(fn);
    }

    return api;
  }

  api.factory = function(name, fn) {
    providers[name] = function() {
      providers[name] = api.invoke(fn);
      return providers[name];
    }

    return api;
  }

  api.value = function(name, value) {
    providers[name] = value;
    return api;
  }

  api.invoke = function(fn, self, locals) {
    var i, name, length, providor, inject = fn.$inject;
    if(!inject) {
      inject = annotate(fn);
    }

    var args = [];

    for(i = 0, length = inject.length; i < length; i++) {
      name = inject[i];

      if(locals && (providor = locals[name])) {
        args.push(providor);
      } else {
        if (typeof name !== 'string') {
          throw Error('Service name expected');
        }

        if(path.indexOf(name) !== -1) {
          throw Error('Circular dependency: ' + path.join(' <- '));
        }

        providor = providers[name];

        if (!providor) {
          throw Error('Service ' + name + ' can not be found: ' + path.join(' <- '));
        }

        try {
          path.unshift(name);

          if(typeof(providor) === 'function') {
            return api.invoke(providor, self, locals);
          }

          return providor;
        } finally {
          path.shift();
        }
      }

      args.push(locals && locals.hasOwnProperty(key) ? locals[key] : get(key, self, locals));
    }

    // Performance optimization: http://jsperf.com/apply-vs-call-vs-invoke
    switch (self ? -1 : args.length) {
      case  0: return fn();
      case  1: return fn(args[0]);
      case  2: return fn(args[0], args[1]);
      case  3: return fn(args[0], args[1], args[2]);
      case  4: return fn(args[0], args[1], args[2], args[3]);
      case  5: return fn(args[0], args[1], args[2], args[3], args[4]);
      case  6: return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
      case  7: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      case  8: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
      case  9: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
      case 10: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
      default: return fn.apply(this, args);
    }
  }

  return api;
}

exports = module.exports = createContainer;

exports.annotate = annotate;
