import * as THREE from "three";

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

const CAMERA = new THREE.Camera();
CAMERA.position.z = 1;
const PASS_THRU_SHADER = createShaderMaterial(passThruFrag);
PASS_THRU_SHADER.uniforms.texture = { value: null };
const SCENE = new THREE.Scene();
const MESH = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), PASS_THRU_SHADER);
SCENE.add(MESH);

export function testCapabilities(rdr: THREE.WebGLRenderer) {
	return null;
}

export function createShaderMaterial(fragShader: string) {
	return new THREE.RawShaderMaterial({
		vertexShader: passThruVert,
		fragmentShader: fragShader
	});
}

export function createTexture(width: number) {
	const tex = new THREE.DataTexture(
		new Uint8Array(width * width * 4),
		width,
		width,
		THREE.RGBAFormat,
		THREE.UnsignedByteType
	);
	tex.needsUpdate = true;
	return tex;
}

export function execute(rdr: THREE.WebGLRenderer, mat: THREE.ShaderMaterial, out: THREE.RenderTarget) {
	MESH.material = mat;
	rdr.setRenderTarget(out);
	rdr.render(SCENE, CAMERA);
	MESH.material = PASS_THRU_SHADER;
}

export function renderTexture(rdr: THREE.WebGLRenderer, input: THREE.Texture, width: number, out: THREE.RenderTarget) {
	PASS_THRU_SHADER.uniforms.u_inputTexture = { value: input };
	PASS_THRU_SHADER.uniforms.u_outputWidth = { value: width };
	execute(rdr, PASS_THRU_SHADER, out);
}

export function createRenderTarget(width: number) {
	return new THREE.WebGLRenderTarget(width, width, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: false,
		stencilBuffer: false
	});
}
