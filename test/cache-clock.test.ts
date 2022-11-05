import chai from "chai";

import { CacheClock } from "../lib/cache-clock";

const cache: CacheClock = new CacheClock();

describe("Cache Clock", () => {
    beforeEach(() => {
        cache.start();

        cache.clear();
        cache.configure({});
    });

    afterEach(() => {
        cache.stop();
    });

    describe("constructor", () => {
        it("should create a new instance of the cache clock", () => {
            chai.expect(cache).to.be.instanceOf(CacheClock);
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

    describe("set", () => {
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
    });

    describe("get", () => {
        it("should return an item from the cache", () => {
            cache.set("foo", "bar");

            chai.expect(cache.get("foo")).to.not.be.undefined;
            chai.expect(cache.get("foo")).to.be.an("object");
            chai.expect(cache.get("foo").v).to.equal("bar");
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
                done();
            }, 350);
        });
    });

    describe("del", () => {
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

    describe("has", () => {
        it("should return true if the item exists", () => {
            cache.set("foo", "bar");

            chai.expect(cache.has("foo")).to.be.true;
        });

        it("should return false if the item does not exist", () => {
            chai.expect(cache.has("foo")).to.be.false;
        });
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
});
