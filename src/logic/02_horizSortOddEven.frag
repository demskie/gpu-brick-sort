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
	// calculate coordinates
	vec2 evenTopLeftFragCoord    = vec2(0.5 + floor(floor(gl_FragCoord.x) - mod(floor(gl_FragCoord.x), 2.0 * GPU_SORTED_OBJECTS_STRIDE)),
										0.5 + floor(floor(gl_FragCoord.y) - mod(floor(gl_FragCoord.y), 2.0 * GPU_SORTED_OBJECTS_STRIDE)));
	vec2 evenBottomLeftFragCoord = vec2(evenTopLeftFragCoord.x, evenTopLeftFragCoord.y + GPU_SORTED_OBJECTS_STRIDE);
	vec2 evenRefCenterFragCoord	 = vec2(evenTopLeftFragCoord.x + GPU_SORTED_OBJECTS_STRIDE / 2.0, evenTopLeftFragCoord.y + GPU_SORTED_OBJECTS_STRIDE / 2.0);
	vec2 oddTopLeftFragCoord     = vec2(evenTopLeftFragCoord.x - GPU_SORTED_OBJECTS_STRIDE, evenTopLeftFragCoord.y);
	vec2 oddBottomLeftFragCoord  = vec2(evenTopLeftFragCoord.x - GPU_SORTED_OBJECTS_STRIDE, evenTopLeftFragCoord.y + GPU_SORTED_OBJECTS_STRIDE);
	vec2 oddRefCenterFragCoord	 = vec2(evenTopLeftFragCoord.x - GPU_SORTED_OBJECTS_STRIDE * 1.5, evenTopLeftFragCoord.y + GPU_SORTED_OBJECTS_STRIDE / 2.0);

	// replace invalid coordinates
	float invalidCoordBool    = floatLessThan(oddTopLeftFragCoord.x, 0.0);
	oddTopLeftFragCoord.x    *= floatEquals(invalidCoordBool, 0.0);
	oddBottomLeftFragCoord.x *= floatEquals(invalidCoordBool, 0.0);
	oddRefCenterFragCoord.x  *= floatEquals(invalidCoordBool, 0.0);
	oddTopLeftFragCoord.x    += invalidCoordBool * evenTopLeftFragCoord.x;
	oddBottomLeftFragCoord.x += invalidCoordBool * evenBottomLeftFragCoord.x;
	oddRefCenterFragCoord.x  += invalidCoordBool * evenRefCenterFragCoord.x;

	// get texels
	vec4 evenTopLeftTexel    = texture2D(u_gpuSortedObjects, evenTopLeftFragCoord / GPU_SORTED_OBJECTS_WIDTH);
	vec4 evenBottomLeftTexel = texture2D(u_gpuSortedObjects, evenBottomLeftFragCoord / GPU_SORTED_OBJECTS_WIDTH);
	vec4 oddTopLeftTexel     = texture2D(u_gpuSortedObjects, oddTopLeftFragCoord / GPU_SORTED_OBJECTS_WIDTH);
	vec4 oddBottomLeftTexel  = texture2D(u_gpuSortedObjects, oddBottomLeftFragCoord / GPU_SORTED_OBJECTS_WIDTH);

	// unpack pixel boolean data
	bool evenBoolArray[8];
	bool oddBoolArray[8];
	unpackBooleans(evenTopLeftTexel.r, evenBoolArray);
	unpackBooleans(oddTopLeftTexel.r, oddBoolArray);

	// unpack pixel position data
	float evenX = vec2ToInt16(evenBottomLeftTexel.rg);
	float oddX  = vec2ToInt16(oddBottomLeftTexel.rg);

	// override positions if bool is not set
	evenX *= floatEquals(float(evenBoolArray[0]), 0.0);
	evenX += floatEquals(float(evenBoolArray[0]), 0.0) * (evenRefCenterFragCoord.x - (GPU_SORTED_OBJECTS_WIDTH / 2.0)) * 65536.0;
	oddX  *= floatEquals(float(oddBoolArray[0]), 0.0);
	oddX  += floatEquals(float(oddBoolArray[0]), 0.0) * (oddRefCenterFragCoord.x - (GPU_SORTED_OBJECTS_WIDTH / 2.0)) * 65536.0;

	// start creating coordinates for source texel
	vec2 sourceFragCoord = vec2(gl_FragCoord.xy);

	// determine if we're outputting to one of the left side texels
	float outputToOddBool = floatLessThan(floor(gl_FragCoord.x), floor(evenTopLeftFragCoord.x)); 

	// add to coordinates if (we_are_odd && even_position_comes_before)
	sourceFragCoord.x += outputToOddBool * floatLessThan(evenX, oddX) * GPU_SORTED_OBJECTS_STRIDE;

	// subtract to coordinates if (we_are_even && even_position_comes_before)
	sourceFragCoord.x -= floatEquals(outputToOddBool, 0.0) * floatLessThan(evenX, oddX) * GPU_SORTED_OBJECTS_STRIDE;
	
	// return the source texel
	gl_FragColor = texture2D(u_gpuSortedObjects, sourceFragCoord / GPU_SORTED_OBJECTS_WIDTH);
	gl_FragColor = texture2D(u_gpuSortedObjects, gl_FragCoord.xy / GPU_SORTED_OBJECTS_WIDTH);
}