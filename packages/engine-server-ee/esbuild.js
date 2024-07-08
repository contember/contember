const buildServer = require('../../scripts/esbuild/esbuild').buildServer

buildServer('./packages/engine-server-ee/src/start.ts')
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
