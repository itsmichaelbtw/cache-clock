# cache-clock 

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/itsmichaelbtw/cache-clock/Unit%20Tests?label=tests)
![GitHub package.json version](https://img.shields.io/github/package-json/v/itsmichaelbtw/cache-clock)
![GitHub](https://img.shields.io/github/license/itsmichaelbtw/cache-clock)

A TypeScript implementation of a cache clock with TTL based expiry, driven by a single `setTimeout` call. Provides simple methods for setting, getting, and deleting cache entries with a chainable API design. By default, the cache is checked every `15 seconds` for expired entries.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [API](#api)
- [Changelog](#changelog)
- [License](#license)

## Features

- Supports TypeScript
- Built for NodeJS and the browser consumption
- Lightweight and fast (4kb gzipped)
- Built-in automatic cache expiry
- Entries are stored in a `Map` for fast retrieval
- Item keys are hashed for fast lookup
- Cache entry statistics

## Installation

```bash
$ npm install cache-clock
```

## Usage

### CommonJS:

```js
const { CacheClock } = require('cache-clock');

// or

const CacheClock = require('cache-clock').CacheClock;

const cache = new CacheClock(config);
```

### ES6:

```js
import { CacheClock } from 'cache-clock';

const cache = new CacheClock(config);
```

> Note: When intializing a new cache clock, the clock will start immediately. You can opt to not start the clock by passing either passing { autoStart: false } or calling the .stop() method.

## Examples

### Basic

```js
import { CacheClock } from 'cache-clock';

const cache = new CacheClock();

cache.set('foo', 'bar');

console.log(cache.get('foo')); // bar
```

### With TTL

```js
const cache = new CacheClock({
    ttl: 10000, // 10 seconds
});

cache.set('foo', 'bar');

// or

const cache = new CacheClock();

cache.set('foo', 'bar', { ttl: 10000 }); // 10 seconds

setTimeout(() => {
    console.log(cache.get('foo')); // undefined
}, 11000);
```

### TTL Overwrite

```js
const cache = new CacheClock({
    ttl: 10000, // 10 seconds
});

cache.set('foo', 'bar', { ttl: 5000 }); // 5 seconds
```

## API

```js
const cache = new CacheClock(options);

// or

const cache = CacheClock.create(options);
```

### age

Returns the age of the cache in milliseconds.

```js
cache.age;
```

### size

Returns the current size of the cache.

```js
cache.size;
```

### options

An `object` representing the current options of the cache.
    
```js
cache.options;
```

### configure([, options])

Update the cache clock configuration. Use this method to update the cache clock configuration after the clock has been initialized. Any items in the cache prior to calling this method will not be affected.

#### options

| Option   | Default  | Description                                                                                                                     |
|----------|----------|---------------------------------------------------------------------------------------------------------------------------------|
| maxItems | 1000     | The maximum number of items to store in the cache at once. Exceeding this limit will remove the oldest entry.                   |
| ttl      | Infinity | The time to live for all entries in the cache.                                                                                  |
| interval | 15000    | The interval in ms to check for expired items. It is recommended to keep this value above `15 seconds` for optimal performance. |
| debug    | false    | Log debug messages to the console. Includes success, warning and error messages.                                                |

### start()

Start the cache clock. This is automatically called when the cache clock is created. You should only need to call this method if you have stopped the cache clock manually.

This will spawn a new clock with the full timeout interval. This does not resume the lock from where it left off.

### stop()

Manually stop the cache clock from running. This will disable the automatic expiration of entries. This does not prevent items from being checked for expiration when using the `.get()` or `.has()` method.

### set(key, value[, options])

Set a new cache entry. If the key already exists, the value will be overwritten by default. You can opt to not overwrite the value by passing { overwrite: false } as the third argument. 

```js
cache.set('foo', 'bar', { ttl: 20000 });
```

When adding new entries, the cache is checked for overflow. If the cache is full, the oldest entry will be removed to make room for the new entry.

### get(key)

Get a cache entry by key. If the entry is not found, `undefined` will be returned. If the entry is found, the entry is checked for expiration and removed if expired. Returns the full entry from the cache.

```js
const entry = cache.get('foo');

// {
//     k: "foo",
//     v: "bar;
//     t: 20000;
//     e: 1611234567890;
// }
```

- `k` - The hashed key of the entry
- `v` - The value of the entry
- `t` - The time to live of the entry
- `e` - The expiry time of the entry

### del(key)

Delete a cache entry by key. If the entry is not found, `undefined` will be returned. If the entry is found, the entry is removed from the cache and returned.

```js
const entry = cache.del('foo');

// {
//     k: "foo",
//     v: "bar;
//     t: 20000;
//     e: 1611234567890;
// }
```

### has(key)

Check if a cache entry exists by key. If the entry is not found, `false` will be returned. If the entry is found, the entry is checked for expiration and removed if expired. Returns `true` if the entry exists.

### clear()

Clear all entries from the cache.

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

## License

[MIT](LICENSE)


