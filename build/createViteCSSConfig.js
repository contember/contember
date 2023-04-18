//@ts-check
import { parse } from 'node:path'
import { defineConfig } from 'vite'

/**
 * @returns {import('vite').UserConfigExport}
 */
export function createViteCSSConfig({ input, output } = { input: 'src/index.css', output: 'dist/assets/style.css' }) {
	const { dir, base: assetFileNames } = parse(output)

	return defineConfig({
		build: {
			emptyOutDir: false,
			rollupOptions: {
				input,
				output: { dir, assetFileNames },
			},
		},
	})
}
