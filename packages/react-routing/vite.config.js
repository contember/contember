import { createViteConfig } from '../../scripts/vite/createViteConfig'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const packageName = basename(dirname(fileURLToPath(import.meta.url)))

export default defineConfig(env => {
	return {
		...createViteConfig(packageName)(env),
		test: {
			environment: 'jsdom',
		},
	}
})
