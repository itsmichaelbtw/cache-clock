export function isUndefined(value: unknown): value is undefined {
    return typeof value === "undefined";
}

export function isPureObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

export function isFunction(value: unknown): value is Function {
    return typeof value === "function";
}

export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isNegative(value: number): boolean {
    return value < 0;
}

export function absolute(value: number): number {
    return Math.abs(value);
}

export function shallowMerge<T = any, U = any>(target: T, source: U): T & U {
    return Object.assign({}, target, source);
}

export function stringify(value: unknown): string {
    if (isUndefined(value)) {
        return "";
    }

    if (isString(value)) {
        return value;
    }

    return JSON.stringify(value);
}
