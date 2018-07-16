var path = require('path');

// variables
var isProduction = process.argv.mode === 'production';
var sourcePath = path.join(__dirname, './src');
var outPath = path.join(__dirname, './dist');


module.exports = {
	context: sourcePath,
	entry: {
		admin: ['./index.tsx'],
	},
	output: {
		path: outPath,
		publicPath: '/dist/',
		filename: isProduction ? '[name].[hash].js' : '[name].js',
	},
	target: 'web',
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
		mainFields: ['main']
	},
	module: {
		rules: [
			// .ts, .tsx
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader'
			},
		],
	},
	devServer: {
		contentBase: sourcePath,
		hot: true,
		stats: {
			warnings: false
		},
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
			"Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
		}
	},
	node: {
		// workaround for webpack-dev-server issue
		// https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
		fs: 'empty',
		net: 'empty'
	}
};
