const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// const AssetsPlugin = require('assets-webpack-plugin')

// variables
const sourcePath = path.join(__dirname, './src')
const outPath = path.join(__dirname, './public')

module.exports = ({ production }) => ({
	context: sourcePath,
	entry: {
		index: ['./index.tsx']
	},
	mode: production ? 'production' : 'development',
	devtool: production ? 'source-map' : 'cheap-module-source-map',
	output: {
		path: outPath,
		publicPath: '/',
		filename: production ? '[name].[hash].js' : '[name].js'
	},
	target: 'web',
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
		mainFields: ['main'],
		alias: {
			react: path.resolve('node_modules/react')
		}
	},
	module: {
		rules: [
			// .ts, .tsx
			{
				test: /\.tsx?$/,
				loader: 'ts-loader'
			},
			{
				test: /\.(png|woff|woff2|eot|ttf|svg)$/,
				loader: 'url-loader?limit=100000'
			},
			{
				test: /\.((s*)css|sass)$/,
				use: [
					production ? MiniCssExtractPlugin.loader : 'style-loader',
					'css-loader',
					'resolve-url-loader',
					'sass-loader'
				]
			}
		]
	},
	devServer: {
		contentBase: path.join(__dirname, './src'),
		hot: true,
		host: '0.0.0.0',
		port: process.env.CONTEMBER_PORT,
		stats: {
			warnings: false
		},
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
		}
	},
	node: {
		// workaround for webpack-dev-server issue
		// https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
		fs: 'empty',
		net: 'empty',
		process: false
	},
	plugins: [
		// new AssetsPlugin(),
		new MiniCssExtractPlugin({
			filename: production ? '[name].[hash].css' : '[name].css'
		}),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify(production ? 'production' : 'development'),
			},
		}),
		new CompressionPlugin(),
		new HtmlWebpackPlugin({
			template: './index.html',
			templateParameters: {
				configuration: production ? '{configuration}' : JSON.stringify({
					apiServer: (process.env.CONTEMBER_API_SERVER),
					loginToken: (process.env.CONTEMBER_LOGIN_TOKEN),
				})
			},
		}),
		// new BundleAnalyzerPlugin(),
	]
})
