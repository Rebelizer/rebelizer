// Reworked injector from Google angular.js project.

var util = require('util')

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
  , FN_ARG_SPLIT = /,/
  , FN_ARG = /^\s*(_?)(\S+?)\1\s*$/
  , STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function noop() {}
function valueFn(value) {return function() {return value;};}

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
  var $inject,
    fnText,
    argDecl,
    last;

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

function createInjector(modulesToLoad, container) {
  var INSTANTIATING = {},
    providerSuffix = 'Provider',
    path = [],
    loadedModules = {},
    providerCache = {
      $provide: {
        provider: supportObject(provider),
        factory: supportObject(factory),
        service: supportObject(service),
        value: supportObject(value),
        constant: supportObject(constant),
        decorator: decorator
      }
    },
    providerInjector = (providerCache.$injector =
      createInternalInjector(providerCache, function() {
        throw Error("Unknown provider: " + path.join(' <- '));
      })),
    instanceCache = {},
    instanceInjector = (instanceCache.$injector =
      createInternalInjector(instanceCache, function(servicename) {
        var provider = providerInjector.get(servicename + providerSuffix);
        return instanceInjector.invoke(provider.$get, provider);
      }));

  //container != {}

  loadModules(modulesToLoad).forEach(function(fn) { instanceInjector.invoke(fn || noop); });

  return instanceInjector;

  ////////////////////////////////////
  // $provider
  ////////////////////////////////////

  function supportObject(delegate) {
    return function(key, value) {
      if (key != null && typeof(key) == 'object') {
        if(key.forEach) {
          function reverseParams(value, key) { delegate(key, value); }
          key.forEach(reverseParams);
        } else {
          for(var i in key) {
            if (key.hasOwnProperty(i)) {
              delegate(i, key[i]);
            }
          }
        }
      } else {
        return delegate(key, value);
      }
    }
  }

  function provider(name, provider_) {
    if (typeof(provider_) == 'function' || util.isArray(provider_)) {
      provider_ = providerInjector.instantiate(provider_);
    }
    if (!provider_.$get) {
      throw Error('Provider ' + name + ' must define $get factory method.');
    }
    return providerCache[name + providerSuffix] = provider_;
  }

  function factory(name, factoryFn) { return provider(name, { $get: factoryFn }); }

  function service(name, constructor) {
    return factory(name, ['$injector', function($injector) {
      return $injector.instantiate(constructor);
    }]);
  }

  function value(name, value) { return factory(name, valueFn(value)); }

  function constant(name, value) {
    providerCache[name] = value;
    instanceCache[name] = value;
  }

  function decorator(serviceName, decorFn) {
    var origProvider = providerInjector.get(serviceName + providerSuffix),
      orig$get = origProvider.$get;

    origProvider.$get = function() {
      var origInstance = instanceInjector.invoke(orig$get, origProvider);
      return instanceInjector.invoke(decorFn, null, {$delegate: origInstance});
    };
  }

  ////////////////////////////////////
  // Module Loading
  ////////////////////////////////////
  function loadModules(modulesToLoad){
    var i, runFn, module, runBlocks = [];

    for(i in modulesToLoad) {
      if(modulesToLoad.hasOwnProperty(i)) {
        module = modulesToLoad[i];

        if (loadedModules[module] == module) {
          continue;
        }

        loadedModules[module] = module;

        if (typeof(module) == 'string') {
          var moduleFn = container[module];
          if(!moduleFn) {
            throw Error("No module: " + module + " in: " + path.join(' <- '));
          }

          runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);

          try {
            for(var invokeQueue = moduleFn._invokeQueue, j = 0, jj = invokeQueue.length; j < jj; j++) {
              var invokeArgs = invokeQueue[j]
                , provider = providerInjector.get(invokeArgs[0]);

              provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
            }
          } catch (e) {
            if (e.message) e.message += ' from ' + module;
            throw e;
          }
        } else if (typeof(module) == 'function') {
          try {
            runFn = providerInjector.invoke(module);
            if(runFn) {
              runBlocks.push(runFn);
            }
          } catch (e) {
            if (e.message) e.message += ' from ' + module;
            throw e;
          }
        } else if (util.isArray(module)) {
          try {
            runFn = providerInjector.invoke(module);
            if(runFn) {
              runBlocks.push(runFn);
            }
          } catch (e) {
            if (e.message) e.message += ' from ' + String(module[module.length - 1]);
            throw e;
          }
        } else {
          assertArgFn(module, 'module');
        }
      }
    }
    return runBlocks;
  }

  ////////////////////////////////////
  // internal Injector
  ////////////////////////////////////

  function createInternalInjector(cache, factory) {

    function getService(serviceName) {
      if (typeof serviceName !== 'string') {
        throw Error('Service name expected');
      }
      if (cache.hasOwnProperty(serviceName)) {
        if (cache[serviceName] === INSTANTIATING) {
          throw Error('Circular dependency: ' + path.join(' <- '));
        }
        return cache[serviceName];
      } else {
        try {
          path.unshift(serviceName);
          cache[serviceName] = INSTANTIATING;
          return cache[serviceName] = factory(serviceName);
        } finally {
          path.shift();
        }
      }
    }

    function invoke(fn, self, locals){
      var args = [],
        $inject = annotate(fn),
        length, i,
        key;

      for(i = 0, length = $inject.length; i < length; i++) {
        key = $inject[i];
        args.push(
          locals && locals.hasOwnProperty(key)
            ? locals[key]
            : getService(key)
        );
      }
      if (!fn.$inject) {
        // this means that we must be an array.
        fn = fn[length];
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
        default: return fn.apply(self, args);
      }
    }

    function instantiate(Type, locals) {
      var Constructor = function() {},
        instance, returnedValue;

      // Check if Type is annotated and use just the given function at n-1 as parameter
      // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
      Constructor.prototype = (util.isArray(Type) ? Type[Type.length - 1] : Type).prototype;
      instance = new Constructor();
      returnedValue = invoke(Type, instance, locals);

      return (returnedValue != null && typeof(returnedValue) == 'object') ? returnedValue : instance;
    }

    return {
      invoke: invoke,
      instantiate: instantiate,
      get: getService,
      annotate: annotate,
      has: function(name) {
        return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name);
      }
    };
  }
}

/////////////////////////////////

function createContainer() {
  var modules = {};

  return {
    module: module,
    createInjector: function(modulesToLoad) {
      return createInjector(modulesToLoad, modules);
    }
  };

  function module(name, requires, configFn) {
    if(typeof(name) != 'string') {
      throw Error('Nodule name not a string');
    }

    if (requires && modules.hasOwnProperty(name)) {
      modules[name] = null;
    }

    return modules[name] || (modules[name] = createIt());

    function createIt() {
      if (!requires) {
        throw Error('No module: ' + name);
      }

      var invokeQueue = [];

      var runBlocks = [];

      var config = invokeLater('$injector', 'invoke');

      var moduleInstance = {
        _invokeQueue: invokeQueue,
        _runBlocks: runBlocks,

        requires: requires,
        name: name,

        provider: invokeLater('$provide', 'provider'),
        factory: invokeLater('$provide', 'factory'),
        service: invokeLater('$provide', 'service'),
        value: invokeLater('$provide', 'value'),
        constant: invokeLater('$provide', 'constant', 'unshift'),

        config: config,

        run: function(block) {
          runBlocks.push(block);
          return this;
        }
      };

      if (configFn) {
        config(configFn);
      }

      return moduleInstance;

      function invokeLater(provider, method, insertMethod) {
        return function() {
          invokeQueue[insertMethod || 'push']([provider, method, arguments]);
          return moduleInstance;
        }
      }
    }
  }
}

exports = module.exports = createContainer;

exports.annotate = annotate;
//exports.createInjector = createInjector;
