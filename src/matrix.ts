class Matrix {
    constructor(public width: number, public length: number, public array: any[][] = []) {}

    shape(): {
        width: number;
        length: number;
    } {
        return {
            width: this.width,
            length: this.length
        };
    }

    static matrix(matrix: any | any[]) {
        return new Matrix(matrix.length, matrix[0].length, matrix);
    }

    #insert_full_matrix(values: any | any[]) {
        if (this.width === values[0].length && this.length === values.length) {
            this.array = values;
            return;
        }
        throw new Error("Specified dimensions are not matching givern array");
    }

    #insert_matrix_block(values: any | any[]) {
        if (values.length === this.width && this.array.length !== this.length) {
            this.array.push(values);
            return;
        }
        throw new Error("Specified dimensions are not matching givern array");
    }

    #insert_matrix_value(values: any) {
        if (this.array.length === this.length) throw new Error("Cannot put any more values in matrix!");
        if (this.array.length === 0) {
            this.array[0] = [values];
        } else if (this.array[this.array.length - 1].length === this.width) {
            this.array.push([values]);
        } else {
            this.array[this.array.length - 1].push(values);
        }
    }

    empty() {
        for (let i = 0; i < this.width; i++) {
            this.array.push([...new Array(this.length)]);
        }
    }

    get(idx = 0, idy = 0) {
        return this.array[idx][idy];
    }

    set(value: number, idx: number, idy: number) {
        this.array[idx][idy] = value;
    }

    set_values(values: any | any[]) {
        try {
            if (Array.isArray(values) && Array.isArray(values[0])) {
                this.#insert_full_matrix(values);
            } else if (Array.isArray(values) && !Array.isArray(values[0])) {
                this.#insert_matrix_block(values);
            } else if (!Array.isArray(values) && !Array.isArray(values[0])) {
                this.#insert_matrix_value(values);
            }
        } catch (err) {
            console.log(err);
        }
    }

    matrix_data() {
        return this.array;
    }
}

export default Matrix;
