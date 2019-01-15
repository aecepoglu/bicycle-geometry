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
				{
					loader: "babel-loader",
					options: {
						plugins: [
							["@babel/plugin-proposal-pipeline-operator", {proposal: "minimal"}],
							["@babel/plugin-proposal-object-rest-spread"],
						]
					}
				},
				{ loader: "eslint-loader" },
			],
		}, {
			test: /\.less/,
			use: [
				"style-loader",
				"css-loader",
				"less-loader",
			],
		}]
	},

	plugins: [
		new WebpackNotifierPlugin({contentImage: undefined}),
		new Dotenv(),
	],

	devServer: {
		contentBase: path.resolve("./public"),
		disableHostCheck: true,
		port: 3000,
	}
};
