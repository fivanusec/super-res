import fs from "fs";
import Upscaling from "../src/upscaling";
import { getPixels, save_img } from "../src/imgparser";

describe("Run bilinear interpolation and create image named lena_bi.png", () => {
    test("Execute bilinear interpolation", async () => {
        const bytesIn = fs.readFileSync("lena.png");
        const pixels = await getPixels(bytesIn, "image/png", 2);

        const resized = Upscaling.bilinear(pixels, 1000, 1000);
        const out_buffer = await save_img(resized, "image/png");
        fs.writeFileSync("lena_bi.png", out_buffer);

        expect(typeof out_buffer).toBe("object");
    });
});
