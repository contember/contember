import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'

const packageList = [
	'admin',
	'admin-i18n',
	// 'admin-sandbox', // Deliberately left out.
	'admin-server',
	'binding',
	'client',
	'react-client',
	'react-multipass-rendering',
	'react-utils',
	'ui',
	'utils',
	'vimeo-file-uploader',
]

export default defineConfig({
	build: {
		target: 'esnext',
	},
	esbuild: {
		jsxInject: `import * as React from 'react'`,
	},
	plugins: [reactRefresh()],
	resolve: {
		alias: [
			...packageList.map(packageName => ({
				find: `@contember/${packageName}`,
				replacement: resolve(__dirname, `packages/${packageName}/src/index.ts`),
			})),
		],
	},
})
