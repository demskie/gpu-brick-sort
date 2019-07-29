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

		let frame = 0;

		const executeRenderFrame = () => {
			main.renderFrame();
			frame = (frame + 1) % 60;
			if (frame === 0) {
				let imageData = ctx.createImageData(canvas.width, canvas.height);
				imageData.data.set(main.getBitmapImage());
				ctx.putImageData(imageData, 0, 0);
			}
			requestAnimationFrame(() => executeRenderFrame());
		};
		executeRenderFrame();
	}

	render() {
		return <canvas id="mainCanvas" width={main.textureWidth / 2} height={main.textureWidth / 2} />;
	}
}

export default App;
