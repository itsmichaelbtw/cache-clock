declare type CacheTTL = number;
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
declare type CacheSetterOptions = Pick<ClockOptions, "ttl" | "overwrite">;
export declare class CacheClock {
    private readonly $birth;
    private readonly $cache;
    private $clock;
    private $options;
    private $statistics;
    /**
     * Create a new instance of the cache clock. You can
     * pass a configuration object to set the default
     * options for all cacheable items.
     *
     * ```js
     * const clock = new CacheClock({ ttl: 5 * 60 * 1000 });
     * ```
     */
    constructor(options?: ClockOptions);
    private prune;
    /**
     * Create a new instance of the cache clock. You can
     * pass a configuration object to set the default
     * options for all cacheable items.
     *
     * ```js
     * const clock = new CacheClock({ ttl: 5 * 60 * 1000 });
     * ```
     */
    static create(options?: ClockOptions): CacheClock;
    /**
     * The age of the cache clock in `ms`.
     */
    get age(): number;
    /**
     * The number of items in the cache.
     */
    get size(): number;
    /**
     * Global configuration that applies to all cacheable items.
     */
    get options(): ClockOptions;
    get stats(): CacheStatistics;
    /**
     * Whether the clock is currently running.
     */
    get isRunning(): boolean;
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
    configure(options?: ClockOptions): void;
    /**
     * Create a cache key based on the input.
     */
    getCacheKey(input: string): string;
    /**
     * Start the cache clock. This is automatically called when the cache clock is created.
     * You should only need to call this method if you have stopped the cache clock manually.
     *
     * This will spawn a new clock with the full timeout interval. This does not resume the
     * clock from where it left off.
     */
    start(): void;
    /**
     * Manually stop the cache clock. This will disable the automatic expiration of items. This does
     * not prevent items from being checked for expiration.
     */
    stop(): void;
    /**
     * Add an item to the cache. Optionally, you can specify a time to live for the item.
     *
     * If the cache is full, the oldest item will be removed.
     */
    set<T>(key: string, value: T, options?: CacheSetterOptions): CacheEntry<T>;
    /**
     * Retrieve an item from the cache. This returns the internal
     * `CacheEntry` used to store the value.
     */
    get<T>(key: string, isHashed?: boolean): CacheEntry<T>;
    /**
     * Deletes an item from the cache. Returns the deleted item
     * if it exists.
     */
    del<T>(key: string, isHashed?: boolean): CacheEntry<T>;
    /**
     * Returns a boolean indicating whether the cache contains an item.
     */
    has(key: string, isHashed?: boolean): boolean;
    /**
     * Wipe the cache clean.
     */
    clear(): void;
    /**
     * Reset the cache statistics.
     */
    resetStats(): void;
    /**
     * Returns a JSON representation of the cache.
     */
    toJSON(): CacheEntry[];
    [Symbol.iterator](): IterableIterator<CacheEntry>;
}
export {};
