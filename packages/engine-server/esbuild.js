const esbuild = require('esbuild')
const { resolvePlugin } = require('../../scripts/esbuild/esbuild')
esbuild.build({
	entryPoints: ['./packages/engine-server/src/start.ts'],
	bundle: true,
	platform: 'node',
	sourcemap: 'external',
	outfile: './server/server.js',
	plugins: [resolvePlugin],
	external: ['pg-native', 'mock-aws-s3', 'aws-sdk', 'nock', 'bcrypt', 'heapdump'],
}).catch(e => {
	console.error(e)
	process.exit(1)
})
