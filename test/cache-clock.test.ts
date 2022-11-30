import chai from "chai";

import { CacheClock } from "../lib/cache-clock";

const cache = new CacheClock();

describe("Cache Clock", () => {
    beforeEach(() => {
        cache.start();

        cache.clear();
        cache.resetStats();
        cache.configure({});
    });

    afterEach(() => {
        cache.stop();
    });

    it("should configure the cache clock", () => {
        cache.configure({
            interval: 20000,
            maxItems: 500,
            ttl: 5000
        });

        chai.expect(cache.options).to.be.an("object");
        chai.expect(cache.options.interval).to.equal(20000);
        chai.expect(cache.options.maxItems).to.equal(500);
        chai.expect(cache.options.ttl).to.equal(5000);
    });

    it("should return the current age of the clock", () => {
        chai.expect(cache.age).to.be.a("number");
    });

    it("should return the correct size of the cache", () => {
        chai.expect(cache.size).to.equal(0);

        cache.set("foo", "bar");
        chai.expect(cache.size).to.equal(1);

        cache.set("bar", "baz");
        chai.expect(cache.size).to.equal(2);
    });

    it("should clear the cache", () => {
        cache.set("foo", "bar");
        cache.set("bar", "baz");

        chai.expect(cache.size).to.equal(2);

        cache.clear();

        chai.expect(cache.size).to.equal(0);
    });

    it("should iterate over the cache", () => {
        cache.set("foo", "bar");
        cache.set("bar", "baz");

        chai.expect(cache.size).to.equal(2);

        for (const item of cache) {
            chai.expect(item).to.be.an("object");
            chai.expect(item.v).to.be.a("string");
            chai.expect(item.t).to.be.a("number");
        }
    });

    it("should periodically clear expired items", (done) => {
        cache.stop();

        cache.configure({
            interval: 500
        });

        cache.start();

        cache.set("foo", "bar", {
            ttl: 250
        });

        chai.expect(cache.size).to.equal(1);

        setTimeout(() => {
            chai.expect(cache.size).to.equal(0);
            done();
        }, 750);
    });

    it("should not clear expired items if the interval is set to 0", (done) => {
        cache.stop();

        cache.configure({
            interval: 0
        });

        cache.start();

        cache.set("foo", "bar", {
            ttl: 250
        });

        chai.expect(cache.size).to.equal(1);

        setTimeout(() => {
            chai.expect(cache.size).to.equal(1);
            done();
        }, 750);
    });

    it("providing an `onExpire` callback should be called when an item expires", (done) => {
        const newCache = new CacheClock({
            interval: 500,
            onExpire: () => {
                chai.expect(cache.size).to.equal(0);
                done();
            },
            autoStart: false
        });

        newCache.start();

        newCache.set("foo", "bar", {
            ttl: 250
        });

        setTimeout(() => {
            newCache.stop();
        }, 750);
    });

    it("should not overflow the `maxItems` property", () => {
        cache.configure({
            maxItems: 5
        });

        for (let i = 0; i < 10; i++) {
            cache.set(String(i), i);
        }

        chai.expect(cache.size).to.equal(5);

        for (let i = 0; i < 5; i++) {
            chai.expect(cache.has(String(i))).to.be.false;
        }

        for (let i = 5; i < 10; i++) {
            chai.expect(cache.has(String(i))).to.be.true;
        }
    });

    describe("constructor", () => {
        it("should create a new instance of the cache clock", () => {
            const cacheInstance = CacheClock.create();

            chai.expect(cache).to.be.instanceOf(CacheClock);
            chai.expect(cacheInstance).to.be.instanceOf(CacheClock);

            cacheInstance.stop();
        });

        it("should create a new instance with a custom config", () => {
            const clock = new CacheClock({
                interval: 20000,
                maxItems: 500,
                ttl: 5000
            });

            chai.expect(clock).to.be.an.instanceOf(CacheClock);
            chai.expect(clock.options).to.be.an("object");
            chai.expect(clock.options.interval).to.equal(20000);
            chai.expect(clock.options.maxItems).to.equal(500);
            chai.expect(clock.options.ttl).to.equal(5000);

            clock.stop();
        });
    });

    describe("statistics", () => {
        it("should update the statistics correctly", () => {
            chai.expect(cache.stats).to.be.an("object");
            chai.expect(cache.stats.hits).to.equal(0);
            chai.expect(cache.stats.misses).to.equal(0);

            cache.get("foo");

            chai.expect(cache.stats.hits).to.equal(1);
            chai.expect(cache.stats.misses).to.equal(1);

            cache.set("bar", "baz");
            cache.get("foo");
            cache.get("bar");

            chai.expect(cache.stats.hits).to.equal(4);
            chai.expect(cache.stats.sets).to.equal(1);
            chai.expect(cache.stats.misses).to.equal(3);
        });

        it("should reset the statistics", () => {
            cache.get("foo");
            cache.get("foo");
            cache.get("foo");
            cache.get("foo");
            cache.get("foo");

            chai.expect(cache.stats.hits).to.equal(5);
            chai.expect(cache.stats.misses).to.equal(5);

            cache.resetStats();

            for (const key in cache.stats) {
                chai.expect(cache.stats[key]).to.equal(0);
            }
        });

        it("should handle stats correctly (hit)", () => {
            cache.set("foo", "bar");
            cache.set("foo", "baz");

            chai.expect(cache.stats.hits).to.equal(2);

            cache.get("foo");
            cache.get("bar");

            chai.expect(cache.stats.hits).to.equal(4);

            cache.del("foo");

            chai.expect(cache.stats.hits).to.equal(4);

            cache.has("foo");

            chai.expect(cache.stats.hits).to.equal(5);
        });

        it("should handle stats correctly (sets)", () => {
            cache.set("foo", "bar");
            cache.set("baz", "qux");
            cache.set("hello", "world");

            chai.expect(cache.stats.sets).to.equal(3);

            cache.set("foo", "quz");
            cache.set("baz", "bar");

            chai.expect(cache.stats.sets).to.equal(3);

            cache.set("foo", "baz", { overwrite: true });
            cache.set("baz", "qux", { overwrite: true });

            chai.expect(cache.stats.sets).to.equal(5);
        });

        it("should handle stats correctly (misses)", () => {
            cache.set("foo", "buz");
            cache.get("buz");

            chai.expect(cache.stats.misses).to.equal(2);

            cache.has("buz");
            cache.has("foo");

            chai.expect(cache.stats.misses).to.equal(3);
        });

        it("should handle stats correctly (evictions)", () => {
            cache.configure({
                maxItems: 5
            });

            for (let i = 0; i < 10; i++) {
                cache.set(String(i), i);
            }

            chai.expect(cache.stats.evictions).to.equal(5);
        });

        it("should handle stats correctly (expired)", (done) => {
            cache.set("foo", "bar", { ttl: 250 });
            cache.set("baz", "qu", { ttl: 300 });

            setTimeout(() => {
                chai.expect(cache.get("foo")).to.be.undefined;
                chai.expect(cache.stats.expired).to.equal(1);
            }, 300);

            setTimeout(() => {
                cache.get("baz");
                chai.expect(cache.stats.expired).to.equal(2);
                done();
            }, 350);
        });

        it("should handle stats correctly (deleted)", () => {
            cache.set("foo", "bar");
            cache.set("baz", "qux");
            cache.set("hello", "world");

            chai.expect(cache.stats.deletes).to.equal(0);

            cache.del("foo");
            cache.del("baz");

            chai.expect(cache.stats.deletes).to.equal(2);

            cache.del("hello");
            cache.del("key");

            chai.expect(cache.stats.deletes).to.equal(3);
        });

        it("should handle stats correctly (overwrites)", () => {
            cache.set("foo", "bar");
            cache.set("foo", "qux", { overwrite: true });

            chai.expect(cache.stats.overwrites).to.equal(1);

            cache.set("foo", "baz", { overwrite: true });
            cache.set("foo", "qu");

            chai.expect(cache.stats.overwrites).to.equal(2);
        });

        it("should handle stats correctly (clears)", () => {
            cache.set("foo", "bar");
            cache.set("baz", "qux");
            cache.set("hello", "world");

            chai.expect(cache.stats.clears).to.equal(0);

            cache.clear();
            cache.clear();
            cache.clear();

            chai.expect(cache.stats.clears).to.equal(3);
            chai.expect(cache.size).to.equal(0);
        });

        it("should handle stats correctly (lifecycles)", (done) => {
            cache.stop();

            cache.configure({
                interval: 50
            });

            cache.start();

            setTimeout(() => {
                chai.expect(cache.stats.lifecycles).to.equal(5);
                done();
            }, 300);
        });
    });

    describe(".set()", () => {
        it("should add an item to the cache", () => {
            cache.set("foo", "bar");

            chai.expect(cache.size).to.equal(1);
            chai.expect(cache.get("foo")).to.be.an("object");
            chai.expect(cache.get("foo").v).to.equal("bar");
            chai.expect(cache.get("foo").t).to.equal(cache.options.ttl);
        });

        it("should add an item to the cache with a custom ttl", () => {
            cache.set("foo", "bar", {
                ttl: 10000
            });

            chai.expect(cache.size).to.equal(1);
            chai.expect(cache.get("foo")).to.be.an("object");
            chai.expect(cache.get("foo").v).to.equal("bar");
            chai.expect(cache.get("foo").t).to.equal(10000);
        });

        it("should return the newly added item", () => {
            const item = cache.set("foo", "bar");

            chai.expect(item).to.be.an("object");
            chai.expect(item).to.have.property("k");
            chai.expect(item).to.have.property("v");
            chai.expect(item).to.have.property("t");
            chai.expect(item).to.have.property("e");
        });

        it("should not overwrite an existing entry", () => {
            cache.set("foo", "bar");
            cache.set("foo", "baz");

            const entry = cache.get("foo");

            chai.expect(cache.size).to.equal(1);
            chai.expect(entry).to.be.an("object");
            chai.expect(entry.v).to.equal("bar");
        });

        it("should overwrite an existing entry", () => {
            cache.set("foo", "bar");
            cache.set("foo", "baz", {
                overwrite: true
            });

            const entry = cache.get("foo");

            chai.expect(cache.size).to.equal(1);
            chai.expect(entry).to.be.an("object");
            chai.expect(entry.v).to.equal("baz");
        });
    });

    describe(".get()", () => {
        it("should return an item from the cache", () => {
            cache.set("foo", "bar");

            const item = cache.get("foo");

            chai.expect(item).to.not.be.undefined;
            chai.expect(item).to.be.an("object");
            chai.expect(item.v).to.equal("bar");
        });

        it("should return undefined if the item does not exist", () => {
            chai.expect(cache.get("foo")).to.be.undefined;
        });

        it("should return undefined if the item has expired", (done) => {
            cache.set("foo", "bar", {
                ttl: 250
            });

            chai.expect(cache.get("foo")).to.not.be.undefined;

            setTimeout(() => {
                chai.expect(cache.get("foo")).to.be.undefined;
                chai.expect(cache.size).to.equal(0);
                done();
            }, 350);
        });

        it("should reset the expiration when accessed", (done) => {
            cache.configure({
                resetTimeoutOnAccess: true
            });

            cache.set("foo", "bar", {
                ttl: 250
            });

            setTimeout(() => {
                chai.expect(cache.get("foo")).to.not.be.undefined;
            }, 200);

            setTimeout(() => {
                chai.expect(cache.get("foo")).to.not.be.undefined;
                chai.expect(cache.size).to.equal(1);
                done();
            }, 350);
        });
    });

    describe(".del()", () => {
        it("should delete an item from the cache", () => {
            cache.set("foo", "bar");

            chai.expect(cache.size).to.equal(1);
            chai.expect(cache.get("foo")).to.not.be.undefined;

            cache.del("foo");

            chai.expect(cache.size).to.equal(0);
            chai.expect(cache.get("foo")).to.be.undefined;
        });

        it("should return the item before it was deleted", () => {
            cache.set("foo", "bar");

            const item = cache.del("foo");

            chai.expect(item).to.be.an("object");
            chai.expect(item.v).to.equal("bar");
        });

        it("should return undefined if the item does not exist", () => {
            const item = cache.del("foo");

            chai.expect(item).to.be.undefined;
        });
    });

    describe(".has()", () => {
        it("should return true if the item exists", () => {
            cache.set("foo", "bar");

            chai.expect(cache.has("foo")).to.be.true;
        });

        it("should return false if the item does not exist", () => {
            chai.expect(cache.has("foo")).to.be.false;
        });
    });
});
