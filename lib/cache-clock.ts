import {
    isUndefined,
    isPureObject,
    isNumber,
    isNegative,
    absolute,
    shallowMerge,
    stringify
} from "../lib/utils";

import { environment } from "./environment";
import { debug } from "./debug";
import { hash } from "./hash";
import { timeProvider } from "./time-provider";

type ClockMap = Map<string, ClockItem>;
type CacheTTL = number;

export interface ClockItem {
    /**
     * Hashed key of the item.
     */
    k: string;
    /**
     * Value passed to be stored.
     */
    v: unknown;
    /**
     * The time to live for the item. If `Infinity`, the item will never expire.
     */
    t: number;
    /**
     * The time this item will expire.
     */
    e: number;
}

export interface ClockOptions {
    /**
     * The maximum number of items to store in the cache.
     *
     * If you wish to disable the maximum number of items check, thought this
     * s not recommended, set this value to `Infinity`.
     *
     * Note: Setting this value to 0 will be treated as 1.
     *
     * Defaults to `1000`.
     */
    maxItems?: number;
    /**
     * The default time to live for items in the cache.
     *
     * You can disable the cache clock by setting this value to `Infinity` or `0`.
     *
     * Defaults to `Infinity`.
     *
     */
    ttl?: CacheTTL;
    /**
     * The interval in `ms` to check for expired items. It is recommended
     * to keep this value above `15 seconds` for optimal performance. If you expect
     * to have a large number of items in the cache, you may want to increase
     * this value to reduce the number of checks.
     *
     * Throughout the life-cycle of a cache clock, items are automatically checked
     * for expiration when accessing methods such as `set`, `get`, etc. This value is only used
     * to check for expired items when the cache clock is idle.
     *
     * Defaults to `15 seconds`.
     */
    interval?: number;
    /**
     * Log debug messages to the console.
     */
    debug?: boolean;
}

type CacheSetterOptions = Pick<ClockOptions, "ttl">;

const DEFAULT_CLOCK_OPTIONS: ClockOptions = {
    maxItems: 1000,
    ttl: Infinity,
    interval: 15 * 1000,
    debug: false
};

function parseCacheOptions(
    options: ClockOptions = {},
    defaultOptions: ClockOptions
): ClockOptions {
    if (!isPureObject(options)) {
        debug(
            "Invalid options passed to cache clock, using defaults.",
            "yellow"
        );
        return defaultOptions;
    }

    const opts = shallowMerge(defaultOptions, options);

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

    if (opts.maxItems === 0) {
        opts.maxItems = 1;
    }

    if (opts.interval < 15000) {
        debug(
            "A cache clock interval less than 15 seconds is not recommended.",
            "yellow"
        );
    }

    return opts;
}

function createEntityKey(key: string, isHashed: boolean): string {
    if (isHashed) {
        return key;
    }

    return hash(stringify(key));
}

export class CacheClock {
    private readonly $birth: number;
    private readonly $cache: ClockMap;
    private readonly $clock: any;

    private $options: ClockOptions;

    /**
     * Create a new instance of the cache clock. You can
     * pass a configuration object to set the default
     * options for all cacheable items.
     *
     * ```js
     * const clock = new CacheClock({ ttl: 5 * 60 * 1000 });
     * ```
     */
    constructor(options?: ClockOptions) {
        this.$birth = timeProvider.now();
        this.$cache = new Map();

        this.configure(options);
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
    static create(options: ClockOptions): CacheClock {
        return new CacheClock(options);
    }

    /**
     * The age of the cache clock in `ms`.
     */
    public get age(): number {
        return timeProvider.now() - this.$birth;
    }

    /**
     * The number of items in the cache.
     */
    public get size(): number {
        return this.$cache.size;
    }

    /**
     * Global configuration that applies to all cacheable items.
     */
    public get options(): ClockOptions {
        return this.$options;
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
    public configure(options: ClockOptions = {}): void {
        this.$options = parseCacheOptions(options, DEFAULT_CLOCK_OPTIONS);

        debug.DEBUG = this.$options.debug;
    }

    /**
     * Start the cache clock. This is automatically called when the cache clock is created.
     * You should only need to call this method if you have stopped the cache clock manually.
     *
     * This will spawn a new clock with the full timeout interval. This does not resume the
     * clock from where it left off.
     */
    public start(): void {
        if (this.$clock) {
            debug("Cache clock is already running. Unable to start.", "yellow");
            return;
        }
    }

    /**
     * Manually stop the cache clock. This will disable the automatic expiration of items. This does
     * not prevent items from being checked for expiration.
     */
    public stop(): void {
        if (!this.$clock) {
            debug("Cache clock is not running. Unable to stop.", "yellow");
            return;
        }
    }

    /**
     * Add an item to the cache. Optionally, you can specify a time to live for the item.
     *
     * If the cache is full, the oldest item will be removed.
     */
    public set(
        key: string,
        value: unknown,
        options?: CacheSetterOptions
    ): this {
        const hashedKey = createEntityKey(key, false);

        const { ttl } = parseCacheOptions(options, this.$options);

        const clockItem: ClockItem = {
            k: hashedKey,
            v: value,
            t: ttl,
            e: timeProvider.now() + ttl
        };

        if (this.$cache.has(hashedKey)) {
            this.$cache.delete(hashedKey);
        }

        if (this.$cache.size >= this.$options.maxItems) {
            debug("The cache is full, removing oldest item.", "yellow");
            this.del(this.$cache.keys().next().value, true);
        }

        this.$cache.set(hashedKey, clockItem);

        return this;
    }

    /**
     * Retrieve an item from the cache. This returns the internal
     * `ClockItem` used to store the value.
     */
    public get(key: string, isHashed: boolean = false): ClockItem {
        const hashedKey = createEntityKey(key, isHashed);

        const item = this.$cache.get(hashedKey);

        if (isUndefined(item)) {
            return undefined;
        }

        if (item.e < timeProvider.now()) {
            debug(`Cache item ${key} has expired.`, "yellow");
            this.del(key, true);
            return undefined;
        }

        return item;
    }

    /**
     * Deletes an item from the cache. Returns the deleted item
     * if it exists.
     */
    public del(key: string, isHashed: boolean = false): ClockItem {
        const hashedKey = createEntityKey(key, isHashed);

        const item = this.$cache.get(hashedKey);

        if (isUndefined(item)) {
            return undefined;
        }

        debug(`Deleting cache item ${key}.`, "yellow");
        this.$cache.delete(hashedKey);

        return item;
    }

    /**
     * Returns a boolean indicating whether the cache contains an item.
     */
    public has(key: string, isHashed: boolean = false): boolean {
        const hashedKey = createEntityKey(key, isHashed);

        return this.$cache.has(hashedKey);
    }

    /**
     * Wipe the cache clean.
     */
    public clear(): void {
        this.$cache.clear();
    }

    public [Symbol.iterator](): IterableIterator<ClockItem> {
        return this.$cache.values();
    }
}