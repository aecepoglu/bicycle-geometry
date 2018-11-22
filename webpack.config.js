const path = require("path");
const WebpackNotifierPlugin = require("webpack-notifier");
const Dotenv = require("dotenv-webpack");

module.exports = {
	devtool: "eval-source-map",
	mode: process.env["WEBPACK_MODE"] || "development",

	entry: "./src/index.js",
	output: {
		path: path.resolve("./public"),
		filename: "code.js",
	},

	module: {
		rules: [{
			test: /\.js$/,
			use: [
				{ loader: "eslint-loader" },
			],
		}, {
			test: /\.css$/,
			use: [
				"style-loader",
				{
					loader: "css-loader",
					options: {
						modules: true,
						localIdentName: "[sha1:hash:hex:4]",
					},
				},
			],
		}]
	},

	plugins: [
		new WebpackNotifierPlugin({contentImage: undefined}),
		new Dotenv(),
	],

	devServer: {
		contentBase: path.resolve("./public"),
		port: 3000,
	}
};
