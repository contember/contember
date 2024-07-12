import { resolve } from 'node:path'
import { contember } from '@contember/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
	const dsn = process.argv.find(it => it.includes('contember://'))
	const projectName = dsn ? new URL(dsn).username : null

	return {
		define: projectName ? { 'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': JSON.stringify(projectName) } : {},
		base: '/',
		plugins: [
			tsconfigPaths(),
			react(),
			contember(),
			{
				name: 'rewrite-middleware',
				configureServer(serve) {
					serve.middlewares.use((req, res, next) => {
						if (req.url === '/app' || (req.url?.startsWith('/app/') && !req.url?.match(/\.\w+($|\?)/))) {
							req.url = '/app/'
						}
						next()
					})
				},
			},
		],
		build: {
			rollupOptions: {
				input: {
					root: resolve(__dirname, './index.html'),
					app: resolve(__dirname, './app/index.html'),
				},
			},
		},
	}
})
