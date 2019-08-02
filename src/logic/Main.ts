/* eslint import/no-webpack-loader-syntax: off */
/* eslint @typescript-eslint/no-unused-vars: off */

import { unpackInt16, packInt16, MIN_INT16, MAX_INT16 } from "./VectorInt16";
import { unpackBooleans, packBooleans } from "./VectorBoolArray";
import * as GPGPU from "./GPGPU";
import { uniformInt32Range } from "./NotRandom";
import * as THREE from "three";

import sweepLeftToRight from "!!raw-loader!./00_sweepLeftToRight.frag";
import horizSortEvenOdd from "!!raw-loader!./01_horizSortEvenOdd.frag";
import horizSortOddEven from "!!raw-loader!./02_horizSortOddEven.frag";
import vertSortEvenOdd from "!!raw-loader!./03_vertSortEvenOdd.frag";
import vertSortOddEven from "!!raw-loader!./04_vertSortOddEven.frag";

export const textureWidth = 4096;

const renderer = new THREE.WebGLRenderer();
const sweepLeftToRightShader = GPGPU.createShaderMaterial(sweepLeftToRight);
const firstShader = GPGPU.createShaderMaterial(horizSortEvenOdd);
const secondShader = GPGPU.createShaderMaterial(horizSortOddEven);
const thirdShader = GPGPU.createShaderMaterial(vertSortEvenOdd);
const fourthShader = GPGPU.createShaderMaterial(vertSortOddEven);
const gpuSortedObjectsTargets = [GPGPU.createRenderTarget(textureWidth), GPGPU.createRenderTarget(textureWidth)];

export function initialize() {
	console.log("initializing");
}

let z = 0;
const switchIndex = () => {
	let oldZ = z;
	z = (z + 1) % 2;
	return oldZ;
};

export function renderFrame() {
	for (var i = 0; i < 512; i++) {
		sweepLeftToRightShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[switchIndex()].texture };
		GPGPU.execute(renderer, sweepLeftToRightShader, gpuSortedObjectsTargets[z]);
	}
}

export function getBitmapImage() {
	const gpuBytes = new Uint8Array(textureWidth * textureWidth * 4);
	renderer.readRenderTargetPixels(gpuSortedObjectsTargets[z], 0, 0, textureWidth, textureWidth, gpuBytes);
	return gpuBytes;
}
