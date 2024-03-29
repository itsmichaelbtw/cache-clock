import {
    isUndefined,
    isPureObject,
    isNumber,
    isNegative,
    absolute,
    shallowMerge,
    stringify,
    isFunction
} from "../lib/utils";

import { environment } from "./environment";
import { debug } from "./debug";
import { hash } from "./hash";

const timeProvider = Date;

type ClockMap = Map<string, CacheEntry>;
type CacheTTL = number;

type Timeout = number | NodeJS.Timeout;

export interface CacheEntry<T = any> {
    /**
     * Hashed key of the item.
     */
    k: string;
    /**
     * Value passed to be stored.
     */
    v: T;
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
     * Programatically determine if you wish for the clock to auto start.
     *
     * This only works when first initializing the clock. If you wish to
     * start or stop the clock after initialization, use the `start` and `stop`
     * methods.
     *
     * Defaults to `true`.
     */
    autoStart?: boolean;
    /**
     * When setting an item, if an entry already exists with the same key,
     * choose whether to overwrite the existing entry or not.
     *
     * Defaults to `false`.
     */
    overwrite?: boolean;
    /**
     * When getting an item, indicate if you wish to reset the expiration
     * time of the item. This includes when a duplicate item is found before
     * attempting to set a new item.
     *
     * This will reset the expiration relative to the current time.
     *
     * Affected methods: `get`, `has` and `set` (when a duplicate is found).
     *
     * Defaults to `false`.
     */
    resetTimeoutOnAccess?: boolean;
    /**
     * Log debug messages to the console.
     */
    debug?: boolean;
    /**
     * A function to call when an item has expired. This is called exclusively
     * when an item has expired and is removed from the cache via the internal clock.
     */
    onExpire?(entry: CacheEntry): void;
}

export interface CacheStatistics {
    /**
     * The number of times the cache was accessed.
     */
    hits: number;
    /**
     * The number of items that were added to the cache.
     */
    sets: number;
    /**
     * The number of times the cache was accessed and
     * no item was found.
     */
    misses: number;
    /**
     * The number of items that were removed from the
     * cache due to `maxItems` overflowing.
     */
    evictions: number;
    /**
     * The number of items that were removed from the
     * cache due to expiration.
     */
    expired: number;
    /**
     * The number of items that were deleted from the
     * cache.
     */
    deletes: number;
    /**
     * The number of items that were overwritten.
     */
    overwrites: number;
    /**
     * The number of times the cache was cleared.
     */
    clears: number;
    /**
     * The number of life-cycle events that were triggered.
     */
    lifecycles: number;
}

type CacheSetterOptions = Pick<ClockOptions, "ttl" | "overwrite">;

const DEFAULT_CLOCK_OPTIONS: ClockOptions = {
    maxItems: 1000,
    ttl: Infinity,
    interval: 15 * 1000,
    debug: false,
    autoStart: true,
    overwrite: false,
    resetTimeoutOnAccess: false
};

function invokeTimeout(callback: Function, delay: number): Timeout {
    const timeout =
        environment === "node" ? global.setTimeout : window.setTimeout;

    return timeout.call(null, callback, delay);
}

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

    if (opts.onExpire && !isFunction(opts.onExpire)) {
        opts.onExpire = undefined;
    }

    if (opts.maxItems === 0) {
        opts.maxItems = 1;
    }

    return opts;
}

function createEntityKey(key: string, isHashed: boolean): string {
    if (isHashed) {
        return key;
    }

    return hash(stringify(key));
}

const DEFAULT_STATISTCS: CacheStatistics = {
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

export class CacheClock {
    private readonly $birth: number;
    private readonly $cache: ClockMap;

    private $clock: Timeout;
    private $options: ClockOptions;
    private $statistics: CacheStatistics;

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

        this.$statistics = Object.assign({}, DEFAULT_STATISTCS);

        if (this.options.autoStart) {
            this.start();
        }
    }

    private prune(): void {
        this.stop();

        const now = timeProvider.now();

        for (const value of this) {
            if (value.e <= now) {
                const entry = this.del(value.k, true);

                if (this.options.onExpire && entry) {
                    this.options.onExpire(entry);
                }

                this.$statistics.expired++;
            }
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
    static create(options: ClockOptions = {}): CacheClock {
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

    public get stats(): CacheStatistics {
        return this.$statistics;
    }

    /**
     * Whether the clock is currently running.
     */
    public get isRunning(): boolean {
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
    public configure(options: ClockOptions = {}): void {
        this.$options = parseCacheOptions(
            options,
            this.options || DEFAULT_CLOCK_OPTIONS
        );

        debug.DEBUG = this.options.debug;

        if (this.options.interval < DEFAULT_CLOCK_OPTIONS.interval) {
            debug(
                "A cache clock interval less than 15 seconds is not recommended.",
                "yellow"
            );
        }
    }

    /**
     * Create a cache key based on the input.
     */
    public getCacheKey(input: string): string {
        return createEntityKey(input, false);
    }

    /**
     * Start the cache clock. This is automatically called when the cache clock is created.
     * You should only need to call this method if you have stopped the cache clock manually.
     *
     * This will spawn a new clock with the full timeout interval. This does not resume the
     * clock from where it left off.
     */
    public start(): void {
        if (this.options.interval === Infinity || this.options.interval === 0) {
            debug(
                "Disabling the clock due to an unsupported interval.",
                "yellow"
            );
            return;
        }

        if (this.$clock) {
            debug("Cache clock is already running. Unable to start.", "red");
            return;
        }

        this.$clock = invokeTimeout(
            this.prune.bind(this),
            this.options.interval
        );
    }

    /**
     * Manually stop the cache clock. This will disable the automatic expiration of items. This does
     * not prevent items from being checked for expiration.
     */
    public stop(): void {
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
    public set<T>(
        key: string,
        value: T,
        options?: CacheSetterOptions
    ): CacheEntry<T> {
        const hashedKey = createEntityKey(key, false);

        const { ttl, overwrite } = parseCacheOptions(options, this.options);

        const clockItem: CacheEntry = {
            k: hashedKey,
            v: value,
            t: ttl,
            e: timeProvider.now() + ttl
        };

        const existingEntry = this.get<T>(hashedKey, true);

        if (existingEntry) {
            if (overwrite) {
                debug(
                    `Overwriting existing cache entry for key "${hashedKey}".`,
                    "yellow"
                );
                this.del(hashedKey, true);
                this.$statistics.overwrites++;
            } else {
                debug(
                    `Unable to set cache item "${hashedKey}". The item already exists.`,
                    "red"
                );
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
    public get<T>(key: string, isHashed: boolean = false): CacheEntry<T> {
        const hashedKey = createEntityKey(key, isHashed);

        const item = this.$cache.get(hashedKey);

        this.$statistics.hits++;

        if (isUndefined(item)) {
            this.$statistics.misses++;
            return undefined;
        }

        const now = timeProvider.now();

        if (item.e < now) {
            debug(`Cache item ${key} has expired.`, "red");
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
    public del<T>(key: string, isHashed: boolean = false): CacheEntry<T> {
        const hashedKey = createEntityKey(key, isHashed);

        const item = this.$cache.get(hashedKey);

        if (isUndefined(item)) {
            return undefined;
        }

        debug(`Deleting cache item ${key}.`, "green");
        this.$cache.delete(hashedKey);
        this.$statistics.deletes++;

        return item;
    }

    /**
     * Returns a boolean indicating whether the cache contains an item.
     */
    public has(key: string, isHashed: boolean = false): boolean {
        const hashedKey = createEntityKey(key, isHashed);
        const entry = this.get(hashedKey, true);

        return !isUndefined(entry);
    }

    /**
     * Wipe the cache clean.
     */
    public clear(): void {
        this.$cache.clear();
        this.$statistics.clears++;
    }

    /**
     * Reset the cache statistics.
     */
    public resetStats(): void {
        this.$statistics = Object.assign({}, DEFAULT_STATISTCS);
    }

    /**
     * Returns a JSON representation of the cache.
     */
    public toJSON(): CacheEntry[] {
        return Array.from(this.$cache.values());
    }

    public [Symbol.iterator](): IterableIterator<CacheEntry> {
        return this.$cache.values();
    }
}

