/* eslint import/no-webpack-loader-syntax: off */

import * as gpu from "gpu-compute";
import { uniformInt32Range } from "./NotRandom";

import horizSortEvenOdd from "!!raw-loader!./01_horizSortEvenOdd.frag";
import horizSortOddEven from "!!raw-loader!./02_horizSortOddEven.frag";
import vertSortEvenOdd from "!!raw-loader!./03_vertSortEvenOdd.frag";
import vertSortOddEven from "!!raw-loader!./04_vertSortOddEven.frag";

export const textureWidth = 1024;
export const cyclesPerFrame = 16;

const renderTarget = new gpu.RenderTarget(textureWidth);
const fragVariables = { textureWidth: `${textureWidth}.0` };
const firstShader = new gpu.ComputeShader(horizSortEvenOdd, fragVariables);
const secondShader = new gpu.ComputeShader(horizSortOddEven, fragVariables);
const thirdShader = new gpu.ComputeShader(vertSortEvenOdd, fragVariables);
const fourthShader = new gpu.ComputeShader(vertSortOddEven, fragVariables);

export function initialize() {
	console.log("initializing");
	const bytes = new Uint8Array(textureWidth * textureWidth * 4);
	for (var i = 0; i < bytes.length; i += 4) {
		const xArr = gpu.packInt16(uniformInt32Range(i, gpu.MIN_INT16, gpu.MAX_INT16));
		const yArr = gpu.packInt16(uniformInt32Range(i + 123, gpu.MIN_INT16, gpu.MAX_INT16));
		bytes[i + 0] = xArr[0];
		bytes[i + 1] = xArr[1];
		bytes[i + 2] = yArr[0];
		bytes[i + 3] = yArr[1];
	}
	console.log("pushing");
	renderTarget.pushTextureData(bytes);
}

export function renderFrame() {
	console.log("computing");
	for (var i = 0; i < cyclesPerFrame; i++) {
		renderTarget.compute(firstShader, { u_gpuSortedObjects: renderTarget });
		renderTarget.compute(secondShader, { u_gpuSortedObjects: renderTarget });
		renderTarget.compute(thirdShader, { u_gpuSortedObjects: renderTarget });
		renderTarget.compute(fourthShader, { u_gpuSortedObjects: renderTarget });
	}
}

export function getBitmapImage() {
	console.log("reading");
	const gpuBytes = renderTarget.readPixels();
	const bmpBytes = new Uint8Array(gpuBytes.length);
	for (var i = 0; i < bmpBytes.length; i += 4) {
		const x = gpu.unpackInt16(gpuBytes[i + 0], gpuBytes[i + 1]);
		const y = gpu.unpackInt16(gpuBytes[i + 2], gpuBytes[i + 3]);
		bmpBytes[i + 0] = 256 * ((x + 32767) / 65536);
		bmpBytes[i + 1] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 2] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 3] = 255;
	}
	return bmpBytes;
}
