import fs from "fs";
import { save_img, getPixels } from "./imgparser";
import Upscaling from "./upscaling";

const main = async () => {
    const bytesIn = fs.readFileSync("lena.png");
    //@ts-ignore
    const pixels = await getPixels(bytesIn, "image/png", 2);

    const resized = Upscaling.bilinear(pixels, 1000, 100);
    const out_buffer = await save_img(resized, "image/png");
    fs.writeFileSync("lena_bi.png", out_buffer);
};

main().catch((err) => console.error(err));
