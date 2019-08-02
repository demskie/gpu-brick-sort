precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D u_gpuSortedObjects;

const float GPU_SORTED_OBJECTS_WIDTH = 4096.0;

float round(float f) { return floor(f + 0.5); }
float floatEquals(float f1, float f2) { return 1.0 - abs(sign(f1 - f2)); }
float floatNotEquals(float f1, float f2) { return abs(sign(f1 - f2)); }
float floatLessThan(float f1, float f2) { return max(sign(f1 - f2), 0.0); }
float floatGreaterThan(float f1, float f2) { return max(sign(f2 - f1), 0.0); }
float floatLessThanOrEqual(float f1, float f2) { return 1.0 - floatGreaterThan(f1, f2); }
float floatGreaterThanOrEqual(float f1, float f2) { return 1.0 - floatLessThan(f1, f2); }
float vec2ToInt16(vec2 v) { return clamp(floor(floor(v.r * 255.0) * 256.0) + floor(v.g * 255.0) - 32767.0, -32767.0, 32768.0); }
vec2 int16ToVec2(float f) { f = clamp(f, -32767.0, 32768.0) + 32767.0; return vec2(floor(f / 256.0), f - floor(f / 256.0) * 256.0) / 255.0; }
void unpackBooleans(float f, inout bool arr[8]) { f = floor(f * 255.0); arr[7] = bool(int(floatGreaterThanOrEqual(f, 128.0))); f -= floatGreaterThanOrEqual(f, 128.0) * 128.0; arr[6] = bool(int(floatGreaterThanOrEqual(f, 64.0))); f -= floatGreaterThanOrEqual(f, 64.0) * 64.0; arr[5] = bool(int(floatGreaterThanOrEqual(f, 32.0))); f -= floatGreaterThanOrEqual(f, 32.0) * 32.0; arr[4] = bool(int(floatGreaterThanOrEqual(f, 16.0))); f -= floatGreaterThanOrEqual(f, 16.0) * 16.0; arr[3] = bool(int(floatGreaterThanOrEqual(f, 8.0))); f -= floatGreaterThanOrEqual(f, 8.0) * 8.0; arr[2] = bool(int(floatGreaterThanOrEqual(f, 4.0))); f -= floatGreaterThanOrEqual(f, 4.0) * 4.0; arr[1] = bool(int(floatGreaterThanOrEqual(f, 2.0))); f -= floatGreaterThanOrEqual(f, 2.0) * 2.0; arr[0] = bool(int(floatGreaterThanOrEqual(f, 1.0))); }
float packBooleans(bool arr[8]) { float f = float(int(arr[7])) * 128.0; f += float(int(arr[6])) * 64.0; f += float(int(arr[5])) * 32.0; f += float(int(arr[4])) * 16.0; f += float(int(arr[3])) * 8.0; f += float(int(arr[2])) * 4.0; f += float(int(arr[1])) * 2.0; return f + float(int(arr[0])); }
vec2 addToVec2(vec2 v, float f, float w) { v.y += floor((v.x + f) / w); v.x = mod(v.x + f, w); return v; }


void main() {
	vec4 color = vec4(gl_FragCoord.x / GPU_SORTED_OBJECTS_WIDTH, 0.0, gl_FragCoord.y / GPU_SORTED_OBJECTS_WIDTH, 1.0);

	vec2 leftFragCoord = vec2(gl_FragCoord.x - 1.0, gl_FragCoord.y);
	leftFragCoord.x = clamp(leftFragCoord.x, 0.5, GPU_SORTED_OBJECTS_WIDTH - 0.5);
	vec4 leftTexel = texture2D(u_gpuSortedObjects, leftFragCoord / GPU_SORTED_OBJECTS_WIDTH);

	// handle the edge case
	leftTexel = leftTexel * floatNotEquals(floor(gl_FragCoord.x), 0.0) + floatEquals(floor(gl_FragCoord.x), 0.0) * color;

	// zeroize color if leftTexel is empty
	color *= floatNotEquals(leftTexel.a, 0.0);

	gl_FragColor = color;
}
