import { unpackInt16, packInt16, MIN_INT16, MAX_INT16 } from "./VectorInt16";
import { unpackBooleans, packBooleans } from "./VectorBoolArray";
import * as GPGPU from "./GPGPU";
import { uniformInt32Range } from "./NotRandom";
import * as chart from "chart.js";
import * as THREE from "three";

/* eslint import/no-webpack-loader-syntax: off */
import horizSortEvenOdd from "!!raw-loader!./01_horizSortEvenOdd.frag";
// import horizSortOddEven from "!!raw-loader!./02_horizSortOddEven.frag";
// import vertSortEvenOdd from "!!raw-loader!./03_vertSortEvenOdd.frag";
// import vertSortOddEven from "!!raw-loader!./04_vertSortOddEven.frag";

export function execute() {
	console.log("starting execution");

	const renderer = new THREE.WebGLRenderer();

	const firstShader = GPGPU.createShaderMaterial(horizSortEvenOdd);
	// const secondShader = GPGPU.createShaderMaterial(horizSortOddEven);
	// const thirdShader = GPGPU.createShaderMaterial(vertSortEvenOdd);
	// const fourthShader = GPGPU.createShaderMaterial(vertSortOddEven);

	const gpuSortedObjectsTargets = new Array() as THREE.WebGLRenderTarget[];
	gpuSortedObjectsTargets[0] = GPGPU.createRenderTarget(4096);
	gpuSortedObjectsTargets[1] = GPGPU.createRenderTarget(4096);

	// u_gpuSortedObjects (texture2D)
	// [00] booleans (8bit bool array)
	// [01] object_type (8bit int)
	// [02] alpha_byte (8bit int)
	// [03] bravo_byte (8bit int)
	// [04] charlie_byte (8bit int)
	// [05] delta_byte (8bit int)
	// [06] echo_byte (8bit int)
	// [07] foxtrot_byte (8bit int)
	// [08,09] position_x (16bit int)
	// [10,11] position_y (16bit int)
	// [12,13] last_position_x (16bit int)
	// [14,15] last_position_y (16bit int)

	const createTextureCPU = () => {
		var i = 0;
		const inputTex = GPGPU.createTexture(4096);
		while (i < inputTex.image.data.length) {
			if (Math.floor(Math.floor(i / 4) / 4096) % 2 === 0) {
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
		GPGPU.renderTexture(renderer, inputTex, 4096, gpuSortedObjectsTargets[0]);
	};

	var j = 0;
	const runPipelinedShaders = () => {
		firstShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[j++ % 2].texture };
		GPGPU.execute(renderer, firstShader, gpuSortedObjectsTargets[j++ % 2]);

		// secondShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[j++ % 2].texture };
		// GPGPU.execute(renderer, secondShader, gpuSortedObjectsTargets[j++ % 2]);

		// thirdShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[j++ % 2].texture };
		// GPGPU.execute(renderer, thirdShader, gpuSortedObjectsTargets[j++ % 2]);

		// fourthShader.uniforms.u_gpuSortedObjects = { value: gpuSortedObjectsTargets[j++ % 2].texture };
		// GPGPU.execute(renderer, fourthShader, gpuSortedObjectsTargets[j++ % 2]);
	};

	createTextureCPU();
	for (var i = 0; i < 1000; i++) {
		runPipelinedShaders();
	}
}
