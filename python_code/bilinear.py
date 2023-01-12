import sys
import math
import time
import numpy as np
from PIL import Image
from scipy import ndimage


def get_progressbar_str(progress):
    END = 170
    MAX_LEN = 30
    BAR_LEN = int(MAX_LEN * progress)
    return ('Progress:[' + '=' * BAR_LEN + ('=' if BAR_LEN < MAX_LEN else '') +
            ' ' * (MAX_LEN - BAR_LEN) + '] %.1f%%' % (progress * 100.))


def GetBilinearPixel(imArr, posX, posY):
    out = []

    # Get integer and fractional parts of numbers
    # print(f"Calculating interpolation for [{posX},{posY}]")
    modXi = int(posX)
    modYi = int(posY)
    modXf = posX - modXi
    modYf = posY - modYi
    modXiPlusOneLim = min(modXi + 1, imArr.shape[1] - 1)
    modYiPlusOneLim = min(modYi + 1, imArr.shape[0] - 1)

    # Get pixels in four corners
    for chan in range(imArr.shape[2]):
        bl = imArr[modYi, modXi, chan]
        br = imArr[modYi, modXiPlusOneLim, chan]
        tl = imArr[modYiPlusOneLim, modXi, chan]
        tr = imArr[modYiPlusOneLim, modXiPlusOneLim, chan]

        # Calculate interpolation
        b = modXf * br + (1. - modXf) * bl
        t = modXf * tr + (1. - modXf) * tl
        pxf = modYf * t + (1. - modYf) * b
        out.append(int(pxf + 0.5))

    return out


def enhance(image):
    print("Enhancing image!")
    black = (0, 0, 0)
    white = (255, 255, 255)
    threshold = (160, 160, 160)

    pixels = image.getdata()
    newPixels = []

    for pixel in pixels:
        if pixel < threshold:
            newPixels.append(black)
        else:
            newPixels.append(white)
    return newPixels


if __name__ == "__main__":
    im = Image.open("lena.png").convert("LA")
    im = np.array(im)
    enlargedShape = list(
        map(int, [im.shape[0] * 5, im.shape[1] * 5, im.shape[2]]))
    enlargedImg = np.empty(enlargedShape, dtype=np.uint8)
    rowScale = float(im.shape[0]) / float(enlargedImg.shape[0])
    colScale = float(im.shape[1]) / float(enlargedImg.shape[1])
    inc = 0
    print("Starting bilinear interpolation")
    for r in range(enlargedImg.shape[0]):
        for c in range(enlargedImg.shape[1]):
            orir = r * rowScale
            oric = c * colScale
            enlargedImg[r, c] = GetBilinearPixel(im, oric, orir)
            inc = inc + 1
            sys.stderr.write('\r\033[K' +
                             get_progressbar_str(inc / (enlargedImg.shape[0] *
                                                        enlargedImg.shape[1])))
            sys.stderr.flush()

    print("Image resized!")
    im = Image.fromarray(enlargedImg)
    newPixels = enhance(im)
    newImg = Image.new('RGB', im.size)
    newImg.putdata(newPixels)
    print("Image is done!")
    im.save("lena_bi_py.png")