import React from "react";
import { execute } from "./logic/Start";

const App: React.FC = () => {
	execute();
	return (
		<div className="App">
			<header className="App-header">
				<p>
					Edit <code>src/logic/start.ts</code> and save to reload.
				</p>
			</header>
		</div>
	);
};

export default App;
