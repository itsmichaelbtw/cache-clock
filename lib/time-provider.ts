import { environment } from "./environment";

interface TimeProvider {
    now(): number;
}

function getBestTimeProvider(): TimeProvider {
    try {
        // future: use either perf_hooks for node js or performance for browser
        // fallback on Date.now() for now
        return Date;
    } catch (error) {
        return Date;
    }
}

export const timeProvider = getBestTimeProvider();
