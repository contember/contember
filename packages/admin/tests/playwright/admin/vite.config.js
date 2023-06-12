// @ts-check
import react from '@vitejs/plugin-react'
import { Readable } from 'stream'
import { defineConfig } from 'vite'
import { entries } from '../../../../../build/packageList'
import { initContemberProjectDev } from '../utils'

const packagesDir = __dirname + '/../../../..'

export default defineConfig({
	root: 'tests/playwright/admin',
	build: {
		minify: false,
		rollupOptions: {
			input: 'tests/playwright/admin/index.html',
			output: { dir: 'tests/playwright/admin/dist' },
			treeshake: { moduleSideEffects: true },
		},
	},
	resolve: {
		alias: entries.map(([packageName, packagePath]) => ({
			find: `@contember/${packageName}`,
			replacement: `${packagesDir}/${packageName}/src`,
		})),
	},
	preview: {
		port: 3333,
		host: '0.0.0.0',
	},
	server: {
		port: 3007,
		host: '0.0.0.0',
	},
	plugins: [react(), {
		name: 'initContemberProject',
		configureServer(server) {
			/**
			 * @param {Readable} stream
			 * @returns {Promise<import('@contember/schema').Schema>}
			 **/
			async function toJson(stream) {
				const chunks = []
				for await (const chunk of stream) chunks.push(chunk)
				return JSON.parse(Buffer.concat(chunks).toString())
			}

			server.middlewares.use('/_init', async (req, res) => {
				const projectSlug = await initContemberProjectDev(await toJson(req))
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ projectSlug }))
			})
		},
	}],
})
