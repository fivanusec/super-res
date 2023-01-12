export function isBuffer(obj: any) {
    return (
        obj !== null &&
        obj.constructor !== null &&
        typeof obj.constructor.isBuffer === "function" &&
        obj.constructor.isBuffer(obj)
    );
}
