const buildServer = require('../../scripts/esbuild/esbuild').buildServer

buildServer('./packages/engine-server/src/start.ts')
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
