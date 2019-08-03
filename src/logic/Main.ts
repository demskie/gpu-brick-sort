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
	const inputTex = GPGPU.createTexture(textureWidth);
	for (var i = 0; i < inputTex.image.data.length; i += 4) {
		const xArr = packInt16(uniformInt32Range(i, MIN_INT16, MAX_INT16));
		const yArr = packInt16(uniformInt32Range(i + 123, MIN_INT16, MAX_INT16));
		inputTex.image.data[i + 0] = xArr[0];
		inputTex.image.data[i + 1] = xArr[1];
		inputTex.image.data[i + 2] = yArr[0];
		inputTex.image.data[i + 3] = yArr[1];
	}
	console.log(inputTex.image.data);
	GPGPU.renderTexture(renderer, inputTex, textureWidth, gpuSortedObjectsTargets[0]);
}

let z = 0;
const switchIndex = () => {
	let oldZ = z;
	z = (z + 1) % 2;
	return oldZ;
};

export function renderFrame() {
	firstShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[switchIndex()].texture };
	GPGPU.execute(renderer, firstShader, gpuSortedObjectsTargets[z]);
	secondShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[switchIndex()].texture };
	GPGPU.execute(renderer, secondShader, gpuSortedObjectsTargets[z]);
	thirdShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[switchIndex()].texture };
	GPGPU.execute(renderer, thirdShader, gpuSortedObjectsTargets[z]);
	fourthShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[switchIndex()].texture };
	GPGPU.execute(renderer, fourthShader, gpuSortedObjectsTargets[z]);
}

export function getBitmapImage() {
	const gpuBytes = new Uint8Array(textureWidth * textureWidth * 4);
	renderer.readRenderTargetPixels(gpuSortedObjectsTargets[z], 0, 0, textureWidth, textureWidth, gpuBytes);
	const bmpBytes = new Uint8Array(textureWidth * textureWidth * 4);
	for (var i = 0; i < gpuBytes.length; i += 4) {
		const x = unpackInt16(gpuBytes[i + 0], gpuBytes[i + 1]);
		const y = unpackInt16(gpuBytes[i + 2], gpuBytes[i + 3]);
		// bmpBytes[i] = gpuBytes[i];
		bmpBytes[i + 0] = 256 * ((x + 32767) / 65536);
		bmpBytes[i + 1] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 2] = 256 * ((y + 32767) / 65536);
		bmpBytes[i + 3] = 255;
	}
	return bmpBytes;
}
