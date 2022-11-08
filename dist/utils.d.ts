export declare function isUndefined(value: unknown): value is undefined;
export declare function isPureObject(value: unknown): value is Record<string, unknown>;
export declare function isNumber(value: unknown): value is number;
export declare function isString(value: unknown): value is string;
export declare function isNegative(value: number): boolean;
export declare function absolute(value: number): number;
export declare function shallowMerge<T = any, U = any>(target: T, source: U): T & U;
export declare function stringify(value: unknown): string;
