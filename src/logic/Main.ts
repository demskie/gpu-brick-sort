/* eslint import/no-webpack-loader-syntax: off */
/* eslint @typescript-eslint/no-unused-vars: off */

import { unpackInt16, packInt16, MIN_INT16, MAX_INT16 } from "./VectorInt16";
import { unpackBooleans, packBooleans } from "./VectorBoolArray";
import * as GPGPU from "./GPGPU";
import { uniformInt32Range } from "./NotRandom";
import * as THREE from "three";

import horizSortEvenOdd from "!!raw-loader!./01_horizSortEvenOdd.frag";
import horizSortOddEven from "!!raw-loader!./02_horizSortOddEven.frag";
import vertSortEvenOdd from "!!raw-loader!./03_vertSortEvenOdd.frag";
import vertSortOddEven from "!!raw-loader!./04_vertSortOddEven.frag";

export const textureWidth = 1024;

const renderer = new THREE.WebGLRenderer();
const firstShader = GPGPU.createShaderMaterial(horizSortEvenOdd);
const secondShader = GPGPU.createShaderMaterial(horizSortOddEven);
const thirdShader = GPGPU.createShaderMaterial(vertSortEvenOdd);
const fourthShader = GPGPU.createShaderMaterial(vertSortOddEven);
const gpuSortedObjectsTargets = [GPGPU.createRenderTarget(textureWidth), GPGPU.createRenderTarget(textureWidth)];

export function initialize() {
	console.log("initializing");
	let i = 0;
	const inputTex = GPGPU.createTexture(textureWidth);
	while (i < inputTex.image.data.length) {
		if (Math.floor(Math.floor(i / 4) / textureWidth) % 2 === 0) {
			const bVal = packBooleans([true, false, false, false, false, false, false, false]);
			inputTex.image.data[i++] = bVal;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
		} else {
			const xArr = packInt16(uniformInt32Range(i, MIN_INT16, MAX_INT16));
			const yArr = packInt16(uniformInt32Range(i + 123, MIN_INT16, MAX_INT16));
			inputTex.image.data[i++] = xArr[0];
			inputTex.image.data[i++] = xArr[1];
			inputTex.image.data[i++] = yArr[0];
			inputTex.image.data[i++] = yArr[1];
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
			inputTex.image.data[i++] = 0;
		}
	}
	console.log(inputTex.image.data);
	GPGPU.renderTexture(renderer, inputTex, textureWidth, gpuSortedObjectsTargets[0]);
}

let z = 0;
export function renderFrame() {
	firstShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[z++ % 2].texture };
	GPGPU.execute(renderer, firstShader, gpuSortedObjectsTargets[z++ % 2]);
	secondShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[z++ % 2].texture };
	GPGPU.execute(renderer, secondShader, gpuSortedObjectsTargets[z++ % 2]);
	thirdShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[z++ % 2].texture };
	GPGPU.execute(renderer, thirdShader, gpuSortedObjectsTargets[z++ % 2]);
	fourthShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[z++ % 2].texture };
	GPGPU.execute(renderer, fourthShader, gpuSortedObjectsTargets[z++ % 2]);
}

export function getBitmapImage() {
	const gpuBytes = new Uint8Array(textureWidth * textureWidth * 4);
	renderer.readRenderTargetPixels(gpuSortedObjectsTargets[z % 2], 0, 0, textureWidth, textureWidth, gpuBytes);
	const bmpBytes = new Uint8Array(textureWidth * textureWidth);
	var i = 0;
	var j = 0;
	while (i < gpuBytes.length) {
		if (Math.floor(Math.floor(i / 4) / textureWidth) % 2 > 0) {
			const x = unpackInt16(gpuBytes[i + 0], gpuBytes[i + 1]);
			const y = unpackInt16(gpuBytes[i + 2], gpuBytes[i + 3]);
			bmpBytes[j++] = 256 * ((x + 32767) / 65536);
			bmpBytes[j++] = 256 * ((y + 32767) / 65536);
			bmpBytes[j++] = 256 * ((y + 32767) / 65536);
			bmpBytes[j++] = 255;
		}
		i += 8;
	}
	return bmpBytes;
}
