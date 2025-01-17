import contember from '@contember/vite-plugin/src'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { resolveConfig } from '../../../scripts/vite/resolveConfig'

export default defineConfig(() => {
	return ({
		plugins: [tsconfigPaths({ root: './' }), react(), contember()],
		resolve: resolveConfig,
	})
})
