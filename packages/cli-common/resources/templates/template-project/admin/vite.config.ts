import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
	root: 'projects',
	esbuild: {
		jsxFactory: '_jsx',
		jsxFragment: '_jsxFragment',
		jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
	},
	build: {
		brotliSize: false,
		chunkSizeWarningLimit: undefined,
	},
	plugins: [reactRefresh()],
	server: {
		host: '0.0.0.0',
		port: 1480,
	},
})
