// import * as THREE from "three";
import * as twgl from "twgl.js";

var glctx: WebGLRenderingContext | undefined;

export function getWebGLContext() {
	if (glctx) return glctx;
	const canvas = document.createElement("canvas");
	if (canvas) {
		const ctx = canvas.getContext("webgl");
		if (ctx) return (glctx = ctx);
	}
	return (glctx = require("gl")(0, 0) as WebGLRenderingContext);
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

export function createProgramInfo(fragShader?: string, vertShader?: string) {
	return twgl.createProgramInfo(getWebGLContext(), [
		fragShader ? fragShader : passThruFrag,
		vertShader ? vertShader : passThruVert
	]);
}

export function createTexture(width: number) {
	const gl = getWebGLContext();
	if (!gl) return null;
	const tex = gl.createTexture();
	if (!tex) return null;
	gl.bindTexture(gl.TEXTURE_2D, tex);
	const level = 0;
	const border = 0;
	const internalFormat = gl.RGBA;
	const format = gl.RGBA;
	const type = gl.UNSIGNED_BYTE;
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, width, border, format, type, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	return tex;
}

export function createRenderTarget(texture: WebGLTexture) {
	const gl = getWebGLContext();
	if (!gl) return null;
	const fb = gl.createFramebuffer();
	if (!fb) return null;
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return fb;
}

const BUFFER_INFO = twgl.createBufferInfoFromArrays(getWebGLContext(), {
	position: {
		data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1],
		numComponents: 2
	},
	texcoord: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]
});

export interface Uniforms {
	[key: string]: number | WebGLTexture;
}

export function execute(program: twgl.ProgramInfo, width: number, framebuffer: WebGLFramebuffer, uniforms?: Uniforms) {
	const gl = getWebGLContext();
	gl.useProgram(program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	twgl.setBuffersAndAttributes(gl, program, BUFFER_INFO);
	twgl.setUniforms(program, uniforms ? uniforms : {});
	gl.viewport(0, 0, width, width);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const PASS_THRU_SHADER_PROGRAM = createProgramInfo(passThruFrag);

export function renderTexture(input: WebGLTexture, width: number, framebuffer: WebGLFramebuffer) {
	execute(PASS_THRU_SHADER_PROGRAM, width, framebuffer, {
		u_inputTexture: { value: input },
		u_outputWidth: { value: width }
	});
}

export function readTargetPixels(width: number, framebuffer: WebGLFramebuffer) {
	const arr = new Uint8Array(width * width * 4);
	const gl = getWebGLContext();
	if (!gl) {
		console.error("Unable to get WebGL context.");
		return arr;
	}
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		console.error("Framebuffer is not complete.");
		return arr;
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.readPixels(0, 0, width, width, gl.RGBA, gl.UNSIGNED_BYTE, arr);
	return arr;
}

// const CAMERA = new THREE.Camera();
// CAMERA.position.z = 1;
// const PASS_THRU_SHADER = createShaderMaterial(passThruFrag) as THREE.RawShaderMaterial
// PASS_THRU_SHADER.uniforms.texture = { value: null };
// const SCENE = new THREE.Scene();
// const MESH = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), PASS_THRU_SHADER);
// SCENE.add(MESH);

// export function testCapabilities(rdr: THREE.WebGLRenderer) {
// 	return null;
// }

// export function createShaderMaterial(fragShader: string) {
// 	return new THREE.RawShaderMaterial({
// 		vertexShader: passThruVert,
// 		fragmentShader: fragShader
// 	});
// }

// export function createTexture(width: number) {
// 	const tex = new THREE.DataTexture(
// 		new Uint8Array(width * width * 4),
// 		width,
// 		width,
// 		THREE.RGBAFormat,
// 		THREE.UnsignedByteType
// 	);
// 	tex.needsUpdate = true;
// 	return tex;
// }

// export function execute(rdr: THREE.WebGLRenderer, mat: THREE.ShaderMaterial, out: THREE.RenderTarget) {
// 	MESH.material = mat;
// 	rdr.setRenderTarget(out);
// 	rdr.render(SCENE, CAMERA);
// 	MESH.material = PASS_THRU_SHADER;
// }

// export function renderTexture(rdr: THREE.WebGLRenderer, input: THREE.Texture, width: number, out: THREE.RenderTarget) {
// 	PASS_THRU_SHADER.uniforms.u_inputTexture = { value: input };
// 	PASS_THRU_SHADER.uniforms.u_outputWidth = { value: width };
// 	execute(rdr, PASS_THRU_SHADER, out);
// }

// export function createRenderTarget(width: number) {
// 	return new THREE.WebGLRenderTarget(width, width, {
// 		wrapS: THREE.ClampToEdgeWrapping,
// 		wrapT: THREE.ClampToEdgeWrapping,
// 		minFilter: THREE.NearestFilter,
// 		magFilter: THREE.NearestFilter,
// 		format: THREE.RGBAFormat,
// 		type: THREE.UnsignedByteType,
// 		depthBuffer: false,
// 		stencilBuffer: false
// 	});
// }
