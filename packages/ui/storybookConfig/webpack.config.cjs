module.exports = ({ config }) => {
	// https://github.com/storybookjs/storybook/issues/3346
	config.module.rules = config.module.rules.filter(
		rule => !(rule.use && rule.use.length && rule.use.find(({ loader }) => loader === 'babel-loader')),
	)
	config.module.rules.push({
		test: /\.(ts|tsx)$/,
		loader: require.resolve('babel-loader'),
		options: {
			presets: [['react-app', { flow: false, typescript: true }]],
		},
	})
	config.resolve.extensions.push('.ts', '.tsx')
	config.module.rules.push({
		test: /\.((s*)css|sass)$/,
		use: [
			'style-loader',
			'css-loader',
			'resolve-url-loader',
			{
				loader: 'sass-loader',
				options: {
					sourceMap: true,
					sourceMapContents: false,
				},
			},
		],
		exclude: /node_modules/,
		include: require('path').resolve('./'),
	})

	return config
}
