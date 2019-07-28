// reference: https://play.golang.org/p/7K59UK0wVt2
// gpu range of integer values: -65536 to 65536

export const MAX_INT16 = 32768;
export const MIN_INT16 = -32767;

// unpack range: -32767 to 32768
export function unpackInt16(a: number, b: number) {
	a = Math.min(Math.max(0, Math.floor(a)), 255);
	b = Math.min(Math.max(0, Math.floor(b)), 255);
	return a * 256 + b - 32767;
}

// pack range: -32767 to 32768
export function packInt16(f: number, v?: number[]) {
	f = Math.min(Math.max(-32767, Math.round(f)), 32768) + 32767;
	if (v === undefined) {
		v = new Array(2);
		v[0] = Math.floor(f / 256);
		v[1] = f - v[0] * 256;
	} else if (v.length === 1) {
		v[0] = Math.floor(f / 256);
		v.push(f - v[0] * 256);
	} else if (v.length === 0) {
		v.push(Math.floor(f / 256));
		v.push(f - v[0] * 256);
	} else {
		v[0] = Math.floor(f / 256);
		v[1] = f - v[0] * 256;
	}
	return v;
}
