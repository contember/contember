module.exports = (storybookBaseConfig: any, configType: string, config: any) => {
	const defaultConfig = config
	return {
		...defaultConfig,
		module: {
			...defaultConfig.module,
			rules: [
				// Temp fix for issue: https://github.com/storybooks/storybook/issues/3346
				...defaultConfig.module.rules.filter(
					(rule: any) =>
						!(rule.use && rule.use.length && rule.use.find(({ loader }: any) => loader === 'babel-loader')),
				),
				// .filter(
				// 	(rule: any) =>
				// 		!(rule.use && rule.use.length && rule.use.find(({ loader }: any) => loader === 'css-loader'))
				// ),
				{
					test: /\.jsx?$/,
					include: require('path').resolve('./'),
					exclude: /(node_modules|dist)/,
					loader: 'babel-loader',
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					loader: 'source-map-loader',
					enforce: 'pre',
				},
				{
					test: /\.((s*)css|sass)$/,
					use: ['style-loader', 'css-loader', 'resolve-url-loader', 'sass-loader'],
					exclude: /node_modules/,
					include: require('path').resolve('./'),
				},
			],
		},
	}
}
// npm i -D style-loader css-loader resolve-url-loader sass-loader node-sass source-map-loader
