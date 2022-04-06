buildServer('./packages/engine-server/src/start.ts')
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
