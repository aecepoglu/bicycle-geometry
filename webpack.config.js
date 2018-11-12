const path = require("path");
const WebpackNotifierPlugin = require("webpack-notifier");

module.exports = {
	devtool: "eval-source-map",
	mode: process.env["WEBPACK_MODE"] || "development",

	entry: "./src/index.js",
	output: {
		path: path.resolve("./public"),
		filename: "code.js",
	},

	module: {
		rules: [
			{
				test: /\.js/,
				use: [
					{ loader: "eslint-loader" },
				],
			}
		]
	},

	plugins: [
		new WebpackNotifierPlugin({contentImage: undefined}),
	],

	devServer: {
		contentBase: path.resolve("./public"),
		port: 3000,
	}
};
