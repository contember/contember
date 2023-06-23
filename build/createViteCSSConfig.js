//@ts-check
import { defineConfig } from 'vite'

/**
 * @param {{ assetFileNames: string; base?: string | undefined; minify: boolean; dir: string; input: string }} param0
 * @returns {import('vite').UserConfigExport}
 */
export function createViteCSSConfig({
	assetFileNames,
	base,
	minify: cssMinify,
	input,
	dir,
} = {
		assetFileNames: '[name][extname]',
		base: './',
		minify: false,
		dir: 'dist/assets',
		input: 'src/index.css',
	}) {
	return defineConfig({
		base,
		build: {
			cssMinify,
			emptyOutDir: false,
			rollupOptions: {
				input,
				output: { dir, assetFileNames },
			},
		},
	})
}
