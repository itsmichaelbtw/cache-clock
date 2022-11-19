# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.3.0](https://github.com/itsmichaelbtw/cache-clock/compare/v1.2.0...v1.3.0) (2022-11-19)


### What's New

* support for external cache key creation with `getCacheKey` ([d3b2043](https://github.com/itsmichaelbtw/cache-clock/commit/d3b20431ac5455fd566c5ec224df4cff48bbeffb))

## [1.2.0](https://github.com/itsmichaelbtw/cache-clock/compare/v1.1.1...v1.2.0) (2022-11-18)


### What's New

* **cache-clock:** check whether the clock is currently running ([89c7646](https://github.com/itsmichaelbtw/cache-clock/commit/89c76460141c293923e6a47c326484d0bc7c73f4))

### [1.1.1](https://github.com/itsmichaelbtw/cache-clock/compare/v1.1.0...v1.1.1) (2022-11-13)


### Fixed

* cd pipeline creating incorrect build outputs ([3582f0d](https://github.com/itsmichaelbtw/cache-clock/commit/3582f0d7e2ce9c54dfa3886e2a53fce40ca25302))
* incorrect github actions token ([4e622bf](https://github.com/itsmichaelbtw/cache-clock/commit/4e622bf473733d2a3a9eec39a524f7967b015932))

## [1.1.0](https://github.com/itsmichaelbtw/cache-clock/compare/v1.0.1...v1.1.0) (2022-11-09)


### Fixed

* incorrect title when creating a new release ([566eb1d](https://github.com/itsmichaelbtw/cache-clock/commit/566eb1db730986cfa2e4b20fc5905564bb6027e5))
* missing run command within workflow ([fc587c3](https://github.com/itsmichaelbtw/cache-clock/commit/fc587c3f5914ff6bd85921838e5746a8be4dd8d2))


### What's New

* support for `autoStart` option ([18c2ef8](https://github.com/itsmichaelbtw/cache-clock/commit/18c2ef8d5744c3349de62b14468992f66d0168be))

### [1.0.1](https://github.com/itsmichaelbtw/cache-clock/compare/v1.0.0...v1.0.1) (2022-11-09)


### What's New

* **cache-clock:** added `onExpire` callback option ([28df250](https://github.com/itsmichaelbtw/cache-clock/commit/28df250fc85b271cb92f8b4dbd03423e655cf00e))


### Fixed

* **cache-clock:** intervals with infinity or 0 creating redundant clocks ([2478fa9](https://github.com/itsmichaelbtw/cache-clock/commit/2478fa962254ef40ef0e4b5510084663423bbaaa))
* failed to exit unit tests as clock instance was still running ([f08e8c8](https://github.com/itsmichaelbtw/cache-clock/commit/f08e8c80d61537cf9d77d54bcd88cf5846567b7d))
* improper use of options accessor being called internally ([cb36382](https://github.com/itsmichaelbtw/cache-clock/commit/cb36382b5f80cc3f3e1b223a4f9a09b1eba27696))
* updating the configuration was incorrectly merging with defaults ([e1d7490](https://github.com/itsmichaelbtw/cache-clock/commit/e1d74905d4fdcef948f987b494e5df5557c63aa6))

## 1.0.0 (2022-11-08)


### What's New

* **cache-clock:** a mappable cache store with a built-in clock to support ttl and more ([30f1d7e](https://github.com/itsmichaelbtw/cache-clock/commit/30f1d7e4047cc1533fb9f34e68fbe49524661bce))
* **cache-clock:** internal timeout clock to prune cacheable items by ttl ([428e3c3](https://github.com/itsmichaelbtw/cache-clock/commit/428e3c3c91ddb5f6b91c96ccff6bdaff20fe4ae5))
* **cache-clock:** mappable keys are now hashed before being added to the cache ([54276f3](https://github.com/itsmichaelbtw/cache-clock/commit/54276f34d89db55670ba3f2d4ad654f29b7b6ea6))
* **debug:** debug operations to the console ([bfb8df7](https://github.com/itsmichaelbtw/cache-clock/commit/bfb8df7b35cde8f517d382062fa9744e662ea26d))
