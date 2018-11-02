const path = require("path");

module.exports = {
	devtool: "eval-source-map",
	mode: process.env["WEBPACK_MODE"] || "development",

	entry: "./index.js",
	output: {
		path: path.resolve("./public"),
		filename: "code.js"
	},

	devServer: {
		contentBase: path.resolve("./public"),
		port: 3000
	}
};
