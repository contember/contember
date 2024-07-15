import { createViteConfig } from '../../scripts/vite/createViteConfig'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const packageName = basename(dirname(fileURLToPath(import.meta.url)))

export default defineConfig(env => {
	let viteConfig = createViteConfig(packageName)(env)
	return {
		...viteConfig,
		build: {
			...viteConfig.build,
			rollupOptions: {

				...viteConfig.build.rollupOptions,
				input: [
					'./src/index.ts',
					'./src/generate.ts',
				],

			},
		},
	}
})
