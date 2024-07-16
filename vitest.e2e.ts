import { defineConfig } from 'vitest/config'
import { resolveConfig } from './scripts/vite/resolveConfig'

export default defineConfig({
	test: {
		dir: './e2e',
	},
})
