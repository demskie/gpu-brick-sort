// reference: https://play.golang.org/p/p6_Uo0VWLER

export function unpackBooleans(n: number, b?: boolean[]) {
	n = Math.min(Math.max(0, Math.floor(n)), 255);
	if (b === undefined || b.length !== 8) {
		b = new Array(8);
	}
	for (var z = 8; z >= 0; z--) {
		var p = Math.pow(2, z);
		if (n >= p) {
			b[z] = true;
			n -= p;
		} else {
			b[z] = false;
		}
	}
	return b;
}

export function packBooleans(b: boolean[]) {
	var n = 0;
	for (var z = 0; z < 8; z++) {
		if (b.length > z && b[z]) {
			n += Math.pow(2, z);
		}
	}
	return n;
}
