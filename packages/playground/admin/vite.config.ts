import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { resolveConfig } from '../../../build/createViteConfig.js'
import { resolve } from 'node:path'

export default defineConfig(() => {
	const dsn = process.argv.find(it => it.includes('://'))
	const projectName = dsn ? new URL(dsn).username : null
	return ({
		define: projectName ? {
			'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': JSON.stringify(projectName),
		} : {},
		base: '/',
		plugins: [
			react(),
			{
				name: 'rewrite-middleware',
				configureServer(serve) {
					serve.middlewares.use((req, res, next) => {
						if (req.url === '/app' || req.url?.startsWith('/app/') && !req.url?.match(/\.\w+($|\?)/)) {
							req.url = '/app/'
						}
						next()
					})
				},
			},
		],
		resolve: resolveConfig,
		build: {
			rollupOptions: {
				input: {
					root: resolve(__dirname, './index.html'),
					app: resolve(__dirname, './app/index.html'),
				},
			},
		},

	})
})
