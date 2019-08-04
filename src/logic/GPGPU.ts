import {
	Camera,
	Scene,
	Mesh,
	PlaneBufferGeometry,
	RawShaderMaterial,
	DataTexture,
	RGBAFormat,
	UnsignedByteType,
	WebGLRenderTarget,
	WebGLRenderer,
	ClampToEdgeWrapping,
	NearestFilter
} from "three";

var glctx: WebGLRenderingContext | undefined;

const isNode = require("detect-node");
export function getWebGLContext() {
	if (glctx) return glctx;
	if (!isNode) {
		const canvas = document.createElement("canvas");
		if (canvas) {
			const ctx = canvas.getContext("webgl");
			if (ctx) return (glctx = ctx);
		}
	}
	glctx = require("gl")(4096, 4096) as WebGLRenderingContext;
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

const RENDERER = new WebGLRenderer({ context: getWebGLContext() });
const CAMERA = new Camera();
const PASS_THRU_SHADER = createShaderMaterial(passThruFrag);
const SCENE = new Scene();
const MESH = new Mesh(new PlaneBufferGeometry(2, 2), PASS_THRU_SHADER);
SCENE.add(MESH);

export function createShaderMaterial(fragShader: string) {
	return new RawShaderMaterial({
		vertexShader: passThruVert,
		fragmentShader: fragShader
	});
}

export function createTexture(width: number) {
	const tex = new DataTexture(new Uint8Array(width * width * 4), width, width, RGBAFormat, UnsignedByteType);
	tex.needsUpdate = true;
	return tex;
}

export function execute(mat: THREE.RawShaderMaterial, out: WebGLRenderTarget) {
	MESH.material = mat;
	RENDERER.setRenderTarget(out);
	RENDERER.render(SCENE, CAMERA);
	MESH.material = PASS_THRU_SHADER;
}

export function renderTexture(input: DataTexture, width: number, out: WebGLRenderTarget) {
	PASS_THRU_SHADER.uniforms.u_inputTexture = { value: input };
	PASS_THRU_SHADER.uniforms.u_outputWidth = { value: width };
	execute(PASS_THRU_SHADER, out);
}

export function createRenderTarget(width: number) {
	return new WebGLRenderTarget(width, width, {
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBAFormat,
		type: UnsignedByteType,
		depthBuffer: false,
		stencilBuffer: false
	});
}

export function readTargetPixels(target: WebGLRenderTarget, width: number, buffer?: Uint8Array) {
	if (!buffer) buffer = new Uint8Array(width * width * 4);
	RENDERER.readRenderTargetPixels(target, 0, 0, width, width, buffer);
	return buffer;
}
