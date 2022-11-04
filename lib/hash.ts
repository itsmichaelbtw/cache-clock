export function hash(input: string): string {
    if (typeof input !== "string") {
        input = JSON.stringify(input);
    }

    const numberHash = input.split("").reduce((a, b) => {
        a = (a << 5) - a + a * 24 + b.charCodeAt(0);
        a |= 0;
        return a;
    }, 0);

    return numberHash.toString(32);
}
