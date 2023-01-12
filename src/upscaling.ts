import ndarray, { GenericArray, NdArray, TypedArray } from "ndarray";

export type Image = NdArray<number[] | TypedArray | GenericArray<number>>;

export default class Upscaling {
    /**
     * Linear interpolation function, run only on small arrays and examples,
     * Good for basic understanding of how can array be upscaled
     * @param image
     * @param size
     * @returns Instance of NDarray which contains data got with linear interpolation
     */

    static linear(image: Image, size: number): Image {
        const calcSize = size * image.data.length - 1;
        const ratio = (image.data.length - 1) / calcSize;
        const resized = ndarray(new Uint8Array(image.data.length));

        for (let i = 0; i < calcSize; i++) {
            const low = Math.floor(ratio * i);
            const high = Math.ceil(ratio * i);

            const weight = ratio * i - low;
            const a = image.get(low);
            const b = image.get(high);

            const pixel = a * (1 - weight) + b * weight;

            resized.set(i, pixel);
        }

        return resized;
    }

    /**
     * Biliniear interpolation, takes image as NDarray and interpolates
     * picture data to upscale by given specs
     *
     * @important WIDTH AND HEIGHT MUST BE SAME AS RATIOING IS NOT IMPLEMENTED
     * @param image {@type NdArray}
     * @param width {@type number}
     * @param height {@type number}
     * @returns Instance of NDarray which contains interpolated data for imported picture
     */

    static bilinear(image: Image, width: number, height: number): Image {
        const img_width = image.shape[0];
        const img_height = image.shape[1];

        let resized = ndarray(new Array(image.data.length), [width, height]);
        const x_ratio = width > 1 ? (img_width - 1) / (width - 1) : 0;
        const y_ratio = height > 1 ? (img_height - 1) / (height - 1) : 0;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const x_l = Math.floor(x_ratio * j);
                const y_l = Math.floor(y_ratio * i);

                const x_h = Math.ceil(x_ratio * j);
                const y_h = Math.ceil(y_ratio * i);

                const x_weight = x_ratio * j - x_l;
                const y_weight = y_ratio * i - y_l;

                const a = image.get(y_l, x_l);
                const b = image.get(y_l, x_h);
                const c = image.get(y_h, x_l);
                const d = image.get(y_h, x_h);

                const pixel =
                    a * (1 - x_weight) * (1 - y_weight) +
                    b * x_weight * (1 - y_weight) +
                    c * y_weight * (1 - x_weight) +
                    d * x_weight * y_weight;
                resized.set(i, j, pixel);
            }
        }
        console.log(resized);
        return resized;
    }
}
