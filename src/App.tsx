import React from "react";
import * as main from "./logic/Main";

class App extends React.Component<{}, {}> {
	componentWillMount() {
		main.initialize();
	}

	componentDidMount() {
		const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		let imageData = ctx.createImageData(canvas.width, canvas.height);
		imageData.data.set(main.getBitmapImage());
		ctx.putImageData(imageData, 0, 0);
		setTimeout(() => {
			let frame = 0;
			const executeRenderFrame = () => {
				main.renderFrame();
				if (frame > main.textureWidth) return console.log("finished");
				if (frame % 1 === 0) {
					let imageData = ctx.createImageData(canvas.width, canvas.height);
					imageData.data.set(main.getBitmapImage());
					if (frame % 128 === 0) console.log(imageData.data);
					ctx.putImageData(imageData, 0, 0);
				}
				frame++;
				requestAnimationFrame(() => executeRenderFrame());
			};
			console.log("starting");
			executeRenderFrame();
		}, 1000);
	}

	render() {
		return <canvas id="mainCanvas" width={main.textureWidth} height={main.textureWidth} />;
	}
}

export default App;
