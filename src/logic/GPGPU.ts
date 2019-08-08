/* eslint @typescript-eslint/no-unused-vars: off */

import * as THREE from "three";
import twgl from "twgl.js";
import isNode from "detect-node";

var glctx: WebGLRenderingContext | undefined;

export function getWebGLContext() {
	if (glctx) return glctx;
	if (!isNode) {
		const canvas = document.createElement("canvas");
		if (canvas) {
			const ctx = canvas.getContext("webgl");
			if (ctx) return (glctx = ctx);
		}
	}
	glctx = require("gl")(1, 1) as WebGLRenderingContext;
	if (!glctx) throw new Error("gl context could not be created");
	return glctx;
}

const passThruVert = `
precision highp float;
precision highp int;
precision highp sampler2D;
attribute vec3 position;
void main() {
	gl_Position = vec4(position, 1.0);
}`;

const passThruFrag = `
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D u_inputTexture;
uniform float u_outputWidth;
void main() {
	vec2 uv = gl_FragCoord.xy / u_outputWidth;
	gl_FragColor = texture2D(u_inputTexture, uv);
}`;

const positionBuffer = (() => {
	const gl = getWebGLContext();
	const buffer = gl.createBuffer();
	if (!buffer) throw new Error("unable to create positionBuffer");
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	const array = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return buffer;
})();

export function createProgram(fragShader: string, vertShader?: string) {
	const gl = getWebGLContext();
	const vert = gl.createShader(gl.VERTEX_SHADER);
	if (!vert) throw new Error(`unable to create vertexShader`);
	gl.shaderSource(vert, vertShader ? vertShader : passThruVert);
	gl.compileShader(vert);
	if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
		throw new Error(`couldn't compile vertexShader because: '${gl.getShaderInfoLog(vert)}'`);
	}
	const frag = gl.createShader(gl.FRAGMENT_SHADER);
	if (!frag) throw new Error(`unable to create fragmentShader`);
	gl.shaderSource(frag, fragShader);
	gl.compileShader(frag);
	if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
		throw new Error(`couldn't compile fragmentShader because: '${gl.getShaderInfoLog(frag)}'`);
	}
	const prog = gl.createProgram();
	if (!prog) throw new Error("unable to create program");
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw new Error(`couldn't link program because '${gl.getProgramInfoLog(prog)}'`);
	}
	return prog;
}

export interface Uniforms {
	[key: string]: {
		value: FBO | number | Int32Array | Float32Array;
		stride?: number;
	};
}

export function execute(program: WebGLProgram, output: FBO, input: Uniforms) {
	const gl = getWebGLContext();
	gl.useProgram(program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
	gl.viewport(0, 0, output.width, output.width);
	// gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positionLocation = gl.getAttribLocation(program, "position");
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	if (!input["u_outputWidth"]) {
		input["u_outputWidth"] = { value: output.width };
	}
	// gl.activeTexture(gl.TEXTURE0);
	// gl.bindTexture(gl.TEXTURE_2D, output.texture);
	let texIndex = 0;
	for (let [uniformName, uniform] of Object.entries(input)) {
		if (!uniform.value) throw new Error("object is missing value");
		switch (uniform.value.constructor) {
			case Number:
				gl.uniform1f(gl.getUniformLocation(program, uniformName), uniform.value as number);
				break;
			case FBO:
				const fbo = uniform.value as FBO;
				if (!fbo.framebuffer || !fbo.texture || !fbo.width) throw new Error("invalid FBO detected");
				if (texIndex >= gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1)
					throw new Error(`using too many uniform textures (${gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS} is the limit).`);
				gl.activeTexture(gl.TEXTURE0 + texIndex++);
				gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
				gl.uniform1i(gl.getUniformLocation(program, uniformName), 0);
				break;
			default:
				throw new Error(`unknown uniform type: '${uniform.value.constructor.name}'`);
		}
		// gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.flush();
	}
}

// const passThruProgram = createProgram(passThruFrag, passThruVert);

export class FBO {
	public readonly width: number;
	public readonly framebuffer: WebGLFramebuffer;
	public readonly texture: WebGLTexture;

	constructor(width: number) {
		const gl = getWebGLContext();
		const fb = gl.createFramebuffer();
		if (!fb) throw new Error("unable to create framebuffer");
		const tx = gl.createTexture();
		if (!tx) throw new Error("unable to create texture");
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tx);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, width, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.width = width;
		this.framebuffer = fb;
		this.texture = tx;
	}

	readPixels(output?: Uint8Array) {
		if (!output) output = new Uint8Array(this.width * this.width * 4);
		const gl = getWebGLContext();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.readPixels(0, 0, this.width, this.width, gl.RGBA, gl.UNSIGNED_BYTE, output);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return output;
	}

	readSomePixels(startX: number, startY: number, stopX?: number, stopY?: number, output?: Uint8Array) {
		stopX = stopX ? stopX : this.width;
		stopY = stopY ? stopY : this.width;
		if (!output) output = new Uint8Array(stopX - startX * stopY - startY * 4);
		const gl = getWebGLContext();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.readPixels(startX, startY, stopX, stopY, gl.RGBA, gl.UNSIGNED_BYTE, output);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return output;
	}

	modifyTexture(bytes: Uint8Array) {
		const gl = getWebGLContext();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.width, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
		// execute(passThruProgram, this, {
		// 	u_inputTexture: { value: inputFBO }
		// });
		return this;
	}
}

// case Int32Array:
// 	switch (uniform.stride && uniform.stride >= 1 && uniform.stride <= 4 ? uniform.stride : 1) {
// 		case 1:
// 			gl.uniform1iv(gl.getUniformLocation(program, uniformName), uniform.value as Int32Array);
// 			break;
// 		case 2:
// 			gl.uniform2iv(gl.getUniformLocation(program, uniformName), uniform.value as Int32Array);
// 			break;
// 		case 3:
// 			gl.uniform3iv(gl.getUniformLocation(program, uniformName), uniform.value as Int32Array);
// 			break;
// 		case 4:
// 			gl.uniform4iv(gl.getUniformLocation(program, uniformName), uniform.value as Int32Array);
// 			break;
// 	}
// 	break;
// case Float32Array:
// 	switch (uniform.stride && uniform.stride >= 1 && uniform.stride <= 4 ? uniform.stride : 1) {
// 		case 1:
// 			gl.uniform1fv(gl.getUniformLocation(program, uniformName), uniform.value as Float32Array);
// 			break;
// 		case 2:
// 			gl.uniform2fv(gl.getUniformLocation(program, uniformName), uniform.value as Float32Array);
// 			break;
// 		case 3:
// 			gl.uniform3fv(gl.getUniformLocation(program, uniformName), uniform.value as Float32Array);
// 			break;
// 		case 4:
// 			gl.uniform4fv(gl.getUniformLocation(program, uniformName), uniform.value as Float32Array);
// 			break;
// 	}
// 	break;

// const RENDERER = new WebGLRenderer({ context: getWebGLContext() });
// const CAMERA = new Camera();
// const PASS_THRU_SHADER = createShaderMaterial(passThruFrag);
// const SCENE = new Scene();
// const MESH = new Mesh(new PlaneBufferGeometry(2, 2), PASS_THRU_SHADER);
// SCENE.add(MESH);

// export function createShaderMaterial(fragShader: string) {
// 	return new THREE.RawShaderMaterial({
// 		vertexShader: passThruVert,
// 		fragmentShader: fragShader
// 	});
// }

// export function createTexture(width: number) {
// 	const tex = new DataTexture(new Uint8Array(width * width * 4), width, width, RGBAFormat, UnsignedByteType);
// 	tex.needsUpdate = true;
// 	return tex;
// }

// export function execute(mat: THREE.RawShaderMaterial, out: WebGLRenderTarget) {
// 	MESH.material = mat;
// 	RENDERER.setRenderTarget(out);
// 	RENDERER.render(SCENE, CAMERA);
// 	MESH.material = PASS_THRU_SHADER;
// }

// export function renderTexture(input: THREE.DataTexture, width: number, out: THREE.WebGLRenderTarget) {
// 	PASS_THRU_SHADER.uniforms.u_inputTexture = { value: input };
// 	PASS_THRU_SHADER.uniforms.u_outputWidth = { value: width };
//  execute(PASS_THRU_SHADER, out);
//}

// export function createRenderTarget(width: number) {
// 	return new WebGLRenderTarget(width, width, {
// 		wrapS: ClampToEdgeWrapping,
// 		wrapT: ClampToEdgeWrapping,
// 		minFilter: NearestFilter,
// 		magFilter: NearestFilter,
// 		format: RGBAFormat,
// 		type: UnsignedByteType,
// 		depthBuffer: false,
// 		stencilBuffer: false
// 	});
// }

// export function readTargetPixels(target: WebGLRenderTarget, width: number, buffer?: Uint8Array) {
// 	if (!buffer) buffer = new Uint8Array(width * width * 4);
// 	RENDERER.readRenderTargetPixels(target, 0, 0, width, width, buffer);
// 	return buffer;
// }
