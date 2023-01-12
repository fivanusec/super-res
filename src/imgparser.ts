import { PNG } from "pngjs";
import type { NdArray } from "ndarray";
import { isBuffer } from "./helpers";
import ndarray from "ndarray";
import fs from "fs";
import request from "request";
import mime from "mime-types";
import savePixels from "save-pixels";
import { Image } from "./upscaling";

type Callback = (err: Error | null, pixels?: NdArray<Uint8Array>) => void;
type PathType = string | Uint8Array | Buffer;
export interface MimeBuffer extends Buffer {
    mimeType: string;
    data: string;
    type: string;
    typeFull: string;
    charset: string;
}

function parse_PNG(path: PathType, callback: Callback, dimension: number) {
    const png = new PNG();
    png.parse(path as string | Buffer, (err, data) => {
        if (err) {
            callback(err);
            return;
        }
        switch (dimension) {
            case 1:
                callback(null, ndarray(new Uint8Array(data.data)));
                break;
            case 2:
                callback(
                    null,
                    ndarray(new Uint8Array(data.data), [data.width | 0, data.height | 0], [4, (4 * data.width) | 0], 0)
                );
                break;
            case 3:
                callback(
                    null,
                    ndarray(
                        new Uint8Array(data.data),
                        [data.width | 0, data.height | 0, 0],
                        [4, (4 * data.width) | 0],
                        0
                    )
                );
                break;
        }
    });
}

function doParse(path: PathType, type: string, callback: Callback, dimension: number) {
    switch (type) {
        case "image/png":
            parse_PNG(path, callback, dimension);
            break;

        default:
            callback(new Error("Unsupported file type " + type));
            break;
    }
}

function get_pixels(
    path: string | Uint8Array | Buffer,
    type: string | false,
    callback: Callback,
    dimension: number
): void {
    if (isBuffer(path)) {
        if (!type) {
            callback(new Error("Invalid file type"));
            return;
        }
        doParse(path, type, callback, dimension);
    } else if (typeof path === "string" && path.indexOf("data:") === 0) {
        try {
            const buffer = parseDataURI(path);
            if (buffer) {
                process.nextTick(function () {
                    doParse(type || buffer.mimeType, buffer.data, callback, dimension);
                });
            } else {
                process.nextTick(function () {
                    callback(new Error("Error parsing data URI"));
                });
            }
        } catch (err) {
            process.nextTick(function () {
                callback(err);
            });
        }
    } else if (
        (typeof path === "string" && path.indexOf("http://") === 0) ||
        (typeof path === "string" && path.indexOf("https://") === 0)
    ) {
        request({ url: path, encoding: null }, function (err, response, body) {
            if (err) {
                callback(err);
                return;
            }

            type = type;
            if (!type) {
                if (response.headers !== undefined) {
                    type = response.headers["content-type"] as string;
                } else if (response.headers !== undefined) {
                    type = response.headers["content-type"];
                }
            }
            if (!type) {
                callback(new Error("Invalid content-type"));
                return;
            }
            doParse(body, type, callback, dimension);
        });
    } else {
        fs.readFile(path as any, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            type = type || mime.lookup(path as string);
            if (!type) {
                callback(new Error("Invalid file type"));
                return;
            }
            doParse(data, type, callback, dimension);
        });
    }
}

function parseDataURI(uri: string): MimeBuffer {
    if (!/^data:/i.test(uri)) {
        throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
    }

    uri = uri.replace(/\r?\n/g, "");

    const firstComma = uri.indexOf(",");
    if (firstComma === -1 || firstComma <= 4) {
        throw new TypeError("malformed data: URI");
    }

    const meta = uri.substring(5, firstComma).split(";");

    let charset = "";
    let base64 = false;
    const type = meta[0] || "text/plain";
    let typeFull = type;
    for (let i = 1; i < meta.length; i++) {
        if (meta[i] === "base64") {
            base64 = true;
        } else {
            typeFull += `;${meta[i]}`;
            if (meta[i].indexOf("charset=") === 0) {
                charset = meta[i].substring(8);
            }
        }
    }

    if (!meta[0] && !charset.length) {
        typeFull += ";charset=US-ASCII";
        charset = "US-ASCII";
    }

    const encoding = base64 ? "base64" : "ascii";
    const data = unescape(uri.substring(firstComma + 1));
    const buffer = Buffer.from(data, encoding) as MimeBuffer;

    buffer.type = type;
    buffer.typeFull = typeFull;

    buffer.charset = charset;

    return buffer;
}

export async function getPixels(data: string | Uint8Array, mimeType?: string, dimension?: number): Promise<NdArray> {
    if (!dimension) dimension = 2;
    if (data instanceof Uint8Array && typeof Buffer !== "undefined") {
        data = Buffer.from(data);
    }

    return new Promise((resolve, reject) => {
        get_pixels(
            data,
            mimeType!,
            (err: Error | null, pixels: NdArray<Uint8Array> | undefined) => {
                if (pixels && !err) {
                    resolve(pixels);
                } else {
                    reject(err);
                }
            },
            dimension as number
        );
    });
}

export async function save_img(pixels: Image, mimeType: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        const internalType = mimeType.replace("image/", "") as "png" | "gif";
        savePixels(pixels, internalType)
            .on("data", (d: Uint8Array) => chunks.push(d))
            .on("end", () => resolve(concat(chunks)))
            .on("error", (e: Error) => reject(e));
    });
}

function concat(arrays: Uint8Array[]): Uint8Array {
    let totalByteLength = 0;
    for (const array of arrays) {
        totalByteLength += array.byteLength;
    }

    const result = new Uint8Array(totalByteLength);

    let byteOffset = 0;
    for (const array of arrays) {
        result.set(array, byteOffset);
        byteOffset += array.byteLength;
    }

    return result;
}
