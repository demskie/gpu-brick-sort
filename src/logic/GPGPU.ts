/* eslint @typescript-eslint/no-unused-vars: off */

import * as twgl from "twgl.js";
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

const bufferInfo = twgl.createBufferInfoFromArrays(getWebGLContext(), {
	position: {
		data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1],
		numComponents: 2
	}
});

export function createProgram(fragShader: string, vertShader?: string) {
	return twgl.createProgramInfo(getWebGLContext(), [vertShader ? vertShader : passThruVert, fragShader]);
}

export interface Uniforms {
	[key: string]: WebGLTexture | number | Int32Array | Float32Array;
}

export function execute(programInfo: twgl.ProgramInfo, output: FBO, input: Uniforms) {
	const gl = getWebGLContext();
	gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	twgl.setUniforms(programInfo, input);
	gl.viewport(0, 0, output.width, output.width);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

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
		return this;
	}
}
