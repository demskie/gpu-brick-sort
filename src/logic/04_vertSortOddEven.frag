precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D u_gpuSortedObjects;

const float GPU_SORTED_OBJECTS_WIDTH = 2048.0;
const float GPU_SORTED_OBJECTS_STRIDE = 2.0;

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
	gl_FragColor = texture2D(u_gpuSortedObjects, gl_FragCoord.xy / GPU_SORTED_OBJECTS_WIDTH);

	// // calculate coordinate reference values
	// float targetTopLeftHorizInt = floor(floor(gl_FragCoord.x) - mod(floor(gl_FragCoord.x), GPU_SORTED_OBJECTS_STRIDE));
	// float targetTopLeftVertInt = floor(floor(gl_FragCoord.y) - mod(floor(gl_FragCoord.y), GPU_SORTED_OBJECTS_STRIDE));
	// float halfTexelWidth = 0.5 / GPU_SORTED_OBJECTS_WIDTH;
	// float fullTexelWidth = 1.0 / GPU_SORTED_OBJECTS_WIDTH;
// 
	// // get local pixels
	// vec4 targetTopLeftTexel = texture2D(u_gpuSortedObjects, 
	// 	vec2(((targetTopLeftHorizInt + 0.0) * fullTexelWidth) + halfTexelWidth,
	// 		 ((targetTopLeftVertInt + 0.0) * fullTexelWidth) + halfTexelWidth));
	// vec4 targetBottomLeftTexel = texture2D(u_gpuSortedObjects, 
	// 	vec2(((targetTopLeftHorizInt + 0.0) * fullTexelWidth) + halfTexelWidth,
	// 		 ((targetTopLeftVertInt + 1.0) * fullTexelWidth) + halfTexelWidth));
// 
	// // unpack local pixel data
	// bool targetBoolArray[8];
	// unpackBooleans(targetTopLeftTexel.r, targetBoolArray);
	// float targetY = vec2ToInt16(targetBottomLeftTexel.ba);
// 
	// // override target position if bool is not set
	// targetY *= floatEquals(float(targetBoolArray[0]), 1.0);
	// targetY += floatEquals(float(targetBoolArray[0]), 1.0) * (65536.0 / GPU_SORTED_OBJECTS_STRIDE)
	// 	* (targetTopLeftVertInt - (GPU_SORTED_OBJECTS_WIDTH / 2.0) + (GPU_SORTED_OBJECTS_STRIDE / 2.0));
// 
	// // determine if target is in front of adjacent texel
	// float targetComesFirstFloat = floatNotEquals(mod(targetTopLeftVertInt, 2.0 * GPU_SORTED_OBJECTS_STRIDE), 0.0);
// 
	// // determine adjacent coordinates
	// float adjacentTopLeftHorizInt = targetTopLeftHorizInt;
	// float adjacentTopLeftVertInt = targetTopLeftVertInt;
	// adjacentTopLeftVertInt += targetComesFirstFloat * GPU_SORTED_OBJECTS_STRIDE;
	// adjacentTopLeftVertInt -= floatNotEquals(targetComesFirstFloat, 1.0) * GPU_SORTED_OBJECTS_STRIDE;
// 
	// // adjust coordinates if we're attempting to access an adjacent texel that is out of bounds
	// adjacentTopLeftVertInt += floatLessThan(adjacentTopLeftVertInt, 0.0) * fullTexelWidth * GPU_SORTED_OBJECTS_STRIDE;
// 
	// // get neighbor pixels
	// vec4 adjacentTopLeftTexel = texture2D(u_gpuSortedObjects, 
	// 	vec2(((adjacentTopLeftHorizInt + 0.0) * fullTexelWidth) + halfTexelWidth,
	// 		 ((adjacentTopLeftVertInt + 0.0) * fullTexelWidth) + halfTexelWidth));
	// vec4 adjacentBottomLeftTexel = texture2D(u_gpuSortedObjects, 
	// 	vec2(((adjacentTopLeftHorizInt + 0.0) * fullTexelWidth) + halfTexelWidth,
	// 		 ((adjacentTopLeftVertInt + 1.0) * fullTexelWidth) + halfTexelWidth));
// 
	// // unpack neighbor pixel data
	// bool adjacentBoolArray[8];
	// unpackBooleans(adjacentTopLeftTexel.r, adjacentBoolArray);
	// float adjacentY = vec2ToInt16(adjacentBottomLeftTexel.ba);
// 
	// // override adjacent position if bool is not set
	// adjacentY *= floatEquals(float(adjacentBoolArray[0]), 1.0);
	// adjacentY += floatEquals(float(adjacentBoolArray[0]), 1.0) * (65536.0 / GPU_SORTED_OBJECTS_STRIDE)
	// 	* (adjacentTopLeftVertInt - (GPU_SORTED_OBJECTS_WIDTH / 2.0) + (GPU_SORTED_OBJECTS_STRIDE / 2.0));
// 
	// // determine first and second coordinate
	// float firstY = targetY * floatEquals(targetComesFirstFloat, 1.0) + adjacentY * floatNotEquals(targetComesFirstFloat, 1.0);
	// float secondY = adjacentY * floatEquals(targetComesFirstFloat, 1.0) + targetY * floatNotEquals(targetComesFirstFloat, 1.0);
// 
	// // calculate source texel coordinates
	// vec2 sourceTexelCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);
	// sourceTexelCoord.y += floatGreaterThan(firstY, secondY) * targetComesFirstFloat * fullTexelWidth * GPU_SORTED_OBJECTS_STRIDE;
	// sourceTexelCoord.y -= floatGreaterThan(firstY, secondY) * floatNotEquals(targetComesFirstFloat, 1.0) * fullTexelWidth * GPU_SORTED_OBJECTS_STRIDE;
// 
	// // return the source texel
	// gl_FragColor = texture2D(u_gpuSortedObjects, sourceTexelCoord);
}