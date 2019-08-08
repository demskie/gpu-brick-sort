/* eslint import/no-webpack-loader-syntax: off */
/* eslint @typescript-eslint/no-unused-vars: off */

import { unpackInt16, packInt16, MIN_INT16, MAX_INT16 } from "./VectorInt16";
import { unpackBooleans, packBooleans } from "./VectorBoolArray";
import * as GPGPU from "./GPGPU";
import { uniformInt32Range } from "./NotRandom";

import horizSortEvenOdd from "!!raw-loader!./01_horizSortEvenOdd.frag";
import horizSortOddEven from "!!raw-loader!./02_horizSortOddEven.frag";
import vertSortEvenOdd from "!!raw-loader!./03_vertSortEvenOdd.frag";
import vertSortOddEven from "!!raw-loader!./04_vertSortOddEven.frag";

export const textureWidth = 1024;

const firstShader = GPGPU.createProgram(horizSortEvenOdd);
const secondShader = GPGPU.createProgram(horizSortOddEven);
const thirdShader = GPGPU.createProgram(vertSortEvenOdd);
const fourthShader = GPGPU.createProgram(vertSortOddEven);
const targets = [new GPGPU.FBO(textureWidth), new GPGPU.FBO(textureWidth)];

export function initialize() {
	console.log("initializing");
	const inputFBO = targets[0];
	if (!inputFBO) return;
	const arr = new Uint8Array(textureWidth * textureWidth * 4);
	for (var i = 0; i < arr.length; i += 4) {
		const xArr = packInt16(uniformInt32Range(i, MIN_INT16, MAX_INT16));
		const yArr = packInt16(uniformInt32Range(i + 123, MIN_INT16, MAX_INT16));
		arr[i + 0] = xArr[0];
		arr[i + 1] = xArr[1];
		arr[i + 2] = yArr[0];
		arr[i + 3] = yArr[1];
	}
	console.log(arr);
	inputFBO.modifyTexture(arr);
}

let z = 0;
const nextIndex = () => (z = (z + 1) % 2);

export function renderFrame() {
	GPGPU.execute(firstShader, targets[1], { u_gpuSortedObjects: targets[0].texture });
	GPGPU.execute(secondShader, targets[0], { u_gpuSortedObjects: targets[1].texture });
	GPGPU.execute(thirdShader, targets[1], { u_gpuSortedObjects: targets[0].texture });
	GPGPU.execute(fourthShader, targets[0], { u_gpuSortedObjects: targets[1].texture });
}

export function getBitmapImage() {
	const gpuBytes = targets[0].readPixels();
	const bmpBytes = new Uint8Array(gpuBytes.length);
	for (var i = 0; i < bmpBytes.length; i += 4) {
		const x = unpackInt16(gpuBytes[i + 0], gpuBytes[i + 1]);
		const y = unpackInt16(gpuBytes[i + 2], gpuBytes[i + 3]);
		bmpBytes[i + 0] = 256 * ((x + 32767) / 65536);
		bmpBytes[i + 1] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 2] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 3] = 255;
	}
	return bmpBytes;
}
