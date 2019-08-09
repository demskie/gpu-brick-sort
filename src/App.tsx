import React from "react";
import * as main from "./logic/Main";

const RENDER_TO_CANVAS = true;

class App extends React.Component<{}, {}> {
	componentWillMount = () => main.initialize();

	componentDidMount() {
		const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		if (RENDER_TO_CANVAS) {
			var imageData = ctx.createImageData(canvas.width, canvas.height);
			imageData.data.set(main.getBitmapImage());
			ctx.putImageData(imageData, 0, 0);
		}
		setTimeout(() => {
			let frame = 0;
			let start = performance.now();
			const executeRenderFrame = () => {
				if (frame++ > main.textureWidth / main.cyclesPerFrame / 2)
					return console.log(`finished in: ${performance.now() - start}ms`);
				main.renderFrame();
				if (RENDER_TO_CANVAS) {
					imageData.data.set(main.getBitmapImage());
					ctx.putImageData(imageData, 0, 0);
				}
				requestAnimationFrame(() => executeRenderFrame());
			};
			console.log("starting");
			executeRenderFrame();
		}, 0);
	}

	render() {
		return <canvas id="mainCanvas" width={main.textureWidth} height={main.textureWidth} />;
	}
}

export default App;
