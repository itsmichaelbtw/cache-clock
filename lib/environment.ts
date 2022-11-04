export type EnvironmentContext = "node" | "browser" | "unknown";

function getCurrentEnvironment(): EnvironmentContext {
    if (
        typeof window !== "undefined" &&
        typeof window.document !== "undefined"
    ) {
        return "browser";
    }

    if (
        typeof process !== "undefined" &&
        process.versions &&
        process.versions.node
    ) {
        return "node";
    }

    return "unknown";
}

export const environment = getCurrentEnvironment();
