/**
    * https://github.com/itsmichaelbtw/cache-clock#readme
    * (c) 2022 Michael Cizek
    * @license MIT
    */

'use strict';

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      var F = function () {};
      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function () {
      it = it.call(o);
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

function isUndefined(value) {
  return typeof value === "undefined";
}
function isPureObject(value) {
  return _typeof(value) === "object" && value !== null && !Array.isArray(value);
}
function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isString(value) {
  return typeof value === "string";
}
function isNegative(value) {
  return value < 0;
}
function absolute(value) {
  return Math.abs(value);
}
function shallowMerge(target, source) {
  return Object.assign({}, target, source);
}
function stringify(value) {
  if (isUndefined(value)) {
    return "";
  }
  if (isString(value)) {
    return value;
  }
  return JSON.stringify(value);
}

function getCurrentEnvironment() {
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    return "browser";
  }
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    return "node";
  }
  return "unknown";
}
var environment = getCurrentEnvironment();

var colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  lightblue: "\x1b[36m"
};
var globals = {
  reset: "\x1b[0m",
  bright: "\x1b[1m"
};
function debug(message, color) {
  if (debug.DEBUG) {
    var prefix = "[CACHE-CLOCK] ";
    var colorizedMessage = "".concat(colors[color]).concat(prefix).concat(message).concat(globals.reset);
    console.log(colorizedMessage);
  }
}
debug.DEBUG = false;

function hash(input) {
  if (typeof input !== "string") {
    input = JSON.stringify(input);
  }
  var numberHash = input.split("").reduce(function (a, b) {
    a = (a << 5) - a + a * 24 + b.charCodeAt(0);
    a |= 0;
    return a;
  }, 0);
  return numberHash.toString(32);
}

var _Symbol$iterator;
var timeProvider = Date;
var DEFAULT_CLOCK_OPTIONS = {
  maxItems: 1000,
  ttl: Infinity,
  interval: 15 * 1000,
  debug: false,
  autoStart: true,
  overwrite: false,
  resetTimeoutOnAccess: false
};
function invokeTimeout(callback, delay) {
  var timeout = environment === "node" ? global.setTimeout : window.setTimeout;
  return timeout.call(null, callback, delay);
}
function parseCacheOptions() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var defaultOptions = arguments.length > 1 ? arguments[1] : undefined;
  if (!isPureObject(options)) {
    debug("Invalid options passed to cache clock, using defaults.", "yellow");
    return defaultOptions;
  }
  var opts = shallowMerge(defaultOptions, options);
  if (isNumber(opts.maxItems) && isNegative(opts.maxItems)) {
    opts.maxItems = absolute(opts.maxItems);
  } else if (!isNumber(opts.maxItems)) {
    opts.maxItems = defaultOptions.maxItems;
  }
  if (isNumber(opts.ttl) && isNegative(opts.ttl)) {
    opts.ttl = absolute(opts.ttl);
  } else if (!isNumber(opts.maxItems)) {
    opts.ttl = defaultOptions.ttl;
  }
  if (isNumber(opts.interval) && isNegative(opts.interval)) {
    opts.interval = absolute(opts.interval);
  } else if (!isNumber(opts.interval)) {
    opts.interval = defaultOptions.interval;
  }
  if (opts.onExpire && !isFunction(opts.onExpire)) {
    opts.onExpire = undefined;
  }
  if (opts.maxItems === 0) {
    opts.maxItems = 1;
  }
  return opts;
}
function createEntityKey(key, isHashed) {
  if (isHashed) {
    return key;
  }
  return hash(stringify(key));
}
var DEFAULT_STATISTCS = {
  hits: 0,
  sets: 0,
  misses: 0,
  evictions: 0,
  expired: 0,
  deletes: 0,
  overwrites: 0,
  clears: 0,
  lifecycles: 0
};
_Symbol$iterator = Symbol.iterator;
var CacheClock = /*#__PURE__*/function () {
  /**
   * Create a new instance of the cache clock. You can
   * pass a configuration object to set the default
   * options for all cacheable items.
   *
   * ```js
   * const clock = new CacheClock({ ttl: 5 * 60 * 1000 });
   * ```
   */
  function CacheClock(options) {
    _classCallCheck(this, CacheClock);
    _defineProperty(this, "$birth", void 0);
    _defineProperty(this, "$cache", void 0);
    _defineProperty(this, "$clock", void 0);
    _defineProperty(this, "$options", void 0);
    _defineProperty(this, "$statistics", void 0);
    this.$birth = timeProvider.now();
    this.$cache = new Map();
    this.configure(options);
    this.$statistics = Object.assign({}, DEFAULT_STATISTCS);
    if (this.options.autoStart) {
      this.start();
    }
  }
  _createClass(CacheClock, [{
    key: "prune",
    value: function prune() {
      this.stop();
      var now = timeProvider.now();
      var _iterator = _createForOfIteratorHelper(this),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var value = _step.value;
          if (value.e <= now) {
            var _entry = this.del(value.k, true);
            if (this.options.onExpire && _entry) {
              this.options.onExpire(_entry);
            }
            this.$statistics.expired++;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.start();
    }

    /**
     * Create a new instance of the cache clock. You can
     * pass a configuration object to set the default
     * options for all cacheable items.
     *
     * ```js
     * const clock = new CacheClock({ ttl: 5 * 60 * 1000 });
     * ```
     */
  }, {
    key: "age",
    get:
    /**
     * The age of the cache clock in `ms`.
     */
    function get() {
      return timeProvider.now() - this.$birth;
    }

    /**
     * The number of items in the cache.
     */
  }, {
    key: "size",
    get: function get() {
      return this.$cache.size;
    }

    /**
     * Global configuration that applies to all cacheable items.
     */
  }, {
    key: "options",
    get: function get() {
      return this.$options;
    }
  }, {
    key: "stats",
    get: function get() {
      return this.$statistics;
    }

    /**
     * Whether the clock is currently running.
     */
  }, {
    key: "isRunning",
    get: function get() {
      return !!this.$clock;
    }

    /**
     * Configure the cache clock. Use this method to change the global configuration
     * that applies to all cacheable items.
     *
     * Items that have been cached prior to updating the configuration will not be
     * affected.
     *
     * ```js
     * const clock = new CacheClock();
     * clock.configure({ ttl: 5 * 60 * 1000 });
     * ```
     */
  }, {
    key: "configure",
    value: function configure() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.$options = parseCacheOptions(options, this.options || DEFAULT_CLOCK_OPTIONS);
      debug.DEBUG = this.options.debug;
      if (this.options.interval < DEFAULT_CLOCK_OPTIONS.interval) {
        debug("A cache clock interval less than 15 seconds is not recommended.", "yellow");
      }
    }

    /**
     * Create a cache key based on the input.
     */
  }, {
    key: "getCacheKey",
    value: function getCacheKey(input) {
      return createEntityKey(input, false);
    }

    /**
     * Start the cache clock. This is automatically called when the cache clock is created.
     * You should only need to call this method if you have stopped the cache clock manually.
     *
     * This will spawn a new clock with the full timeout interval. This does not resume the
     * clock from where it left off.
     */
  }, {
    key: "start",
    value: function start() {
      if (this.options.interval === Infinity || this.options.interval === 0) {
        debug("Disabling the clock due to an unsupported interval.", "yellow");
        return;
      }
      if (this.$clock) {
        debug("Cache clock is already running. Unable to start.", "red");
        return;
      }
      this.$clock = invokeTimeout(this.prune.bind(this), this.options.interval);
    }

    /**
     * Manually stop the cache clock. This will disable the automatic expiration of items. This does
     * not prevent items from being checked for expiration.
     */
  }, {
    key: "stop",
    value: function stop() {
      if (!this.$clock) {
        debug("Cache clock is not running. Unable to stop.", "red");
        return;
      }
      clearTimeout(this.$clock);
      this.$clock = null;
      this.$statistics.lifecycles++;
    }

    /**
     * Add an item to the cache. Optionally, you can specify a time to live for the item.
     *
     * If the cache is full, the oldest item will be removed.
     */
  }, {
    key: "set",
    value: function set(key, value, options) {
      var hashedKey = createEntityKey(key, false);
      var _parseCacheOptions = parseCacheOptions(options, this.options),
        ttl = _parseCacheOptions.ttl,
        overwrite = _parseCacheOptions.overwrite;
      var clockItem = {
        k: hashedKey,
        v: value,
        t: ttl,
        e: timeProvider.now() + ttl
      };
      var existingEntry = this.get(hashedKey, true);
      if (existingEntry) {
        if (overwrite) {
          debug("Overwriting existing cache entry for key \"".concat(hashedKey, "\"."), "yellow");
          this.del(hashedKey, true);
          this.$statistics.overwrites++;
        } else {
          debug("Unable to set cache item \"".concat(hashedKey, "\". The item already exists."), "red");
          return existingEntry;
        }
      }
      if (this.size >= this.options.maxItems) {
        debug("The cache is full, removing oldest item.", "yellow");
        this.del(this.$cache.keys().next().value, true);
        this.$statistics.evictions++;
      }
      this.$cache.set(hashedKey, clockItem);
      this.$statistics.sets++;
      return clockItem;
    }

    /**
     * Retrieve an item from the cache. This returns the internal
     * `CacheEntry` used to store the value.
     */
  }, {
    key: "get",
    value: function get(key) {
      var isHashed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var hashedKey = createEntityKey(key, isHashed);
      var item = this.$cache.get(hashedKey);
      this.$statistics.hits++;
      if (isUndefined(item)) {
        this.$statistics.misses++;
        return undefined;
      }
      var now = timeProvider.now();
      if (item.e < now) {
        debug("Cache item ".concat(key, " has expired."), "red");
        this.del(hashedKey, true);
        this.$statistics.expired++;
        return undefined;
      }
      if (this.options.resetTimeoutOnAccess) {
        item.e = now + item.t;
      }
      return item;
    }

    /**
     * Deletes an item from the cache. Returns the deleted item
     * if it exists.
     */
  }, {
    key: "del",
    value: function del(key) {
      var isHashed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var hashedKey = createEntityKey(key, isHashed);
      var item = this.$cache.get(hashedKey);
      if (isUndefined(item)) {
        return undefined;
      }
      debug("Deleting cache item ".concat(key, "."), "green");
      this.$cache["delete"](hashedKey);
      this.$statistics.deletes++;
      return item;
    }

    /**
     * Returns a boolean indicating whether the cache contains an item.
     */
  }, {
    key: "has",
    value: function has(key) {
      var isHashed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var hashedKey = createEntityKey(key, isHashed);
      var entry = this.get(hashedKey, true);
      return !isUndefined(entry);
    }

    /**
     * Wipe the cache clean.
     */
  }, {
    key: "clear",
    value: function clear() {
      this.$cache.clear();
      this.$statistics.clears++;
    }

    /**
     * Reset the cache statistics.
     */
  }, {
    key: "resetStats",
    value: function resetStats() {
      this.$statistics = Object.assign({}, DEFAULT_STATISTCS);
    }

    /**
     * Returns a JSON representation of the cache.
     */
  }, {
    key: "toJSON",
    value: function toJSON() {
      return Array.from(this.$cache.values());
    }
  }, {
    key: _Symbol$iterator,
    value: function value() {
      return this.$cache.values();
    }
  }], [{
    key: "create",
    value: function create() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return new CacheClock(options);
    }
  }]);
  return CacheClock;
}();

exports.CacheClock = CacheClock;
//# sourceMappingURL=index.cjs.map
