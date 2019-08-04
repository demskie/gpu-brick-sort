import * as main from "./logic/Main";

test("test nodejs gpgpu compute", () => {
	let frame = 0;
	const executeRenderFrame = () => {
		main.renderFrame();
		if (frame > main.textureWidth) return console.log("finished");
		frame++;
		requestAnimationFrame(() => executeRenderFrame());
	};
	executeRenderFrame();
});
