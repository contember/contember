import contember from '@contember/vite-plugin/src'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
// @ts-ignore
import { resolveConfig } from '../../../scripts/vite/resolveConfig.js'

const fromHere = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Mirrors `paths` in ./tsconfig.json; the first match wins, so the more specific prefixes go first.
const tsconfigPathAliases = [
	{ find: /^~\/lib\/ui\//, replacement: fromHere('../../react-ui-lib-base/src/ui/') },
	{ find: /^~\/lib\/utils(?=\/|$)/, replacement: fromHere('../../react-ui-lib-base/src/utils') },
	{ find: /^~\/lib\/dict$/, replacement: fromHere('../../react-ui-lib-base/src/dict') },
	{ find: /^~\/lib\/toast$/, replacement: fromHere('../../react-ui-lib-base/src/toast') },
	{ find: /^~\/lib\/tenant(?=\/|$)/, replacement: fromHere('../../react-ui-lib-tenant/src') },
	{ find: /^~\/lib\//, replacement: fromHere('../../react-ui-lib/src/') },
	{ find: /^~\//, replacement: fromHere('./') },
]

export default defineConfig(() => {
	return ({
		plugins: [tailwindcss(), react(), contember()],
		resolve: {
			...resolveConfig,
			alias: [
				...tsconfigPathAliases,
				...Object.entries(resolveConfig.alias).map(([find, replacement]) => ({ find, replacement })),
			],
		},
		build: {
			rollupOptions: {
				input: {
					root: './admin/index.html',
					app: `./admin/app/index.html`,
				},
			},
		},
	})
})
