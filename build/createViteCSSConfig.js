//@ts-check
import { parse } from 'node:path'
import { defineConfig } from 'vite'

/**
 * @param {{ assetFileNames: string; minify: boolean; dir: string; input: string }} param0
 * @returns {import('vite').UserConfigExport}
 */
export function createViteCSSConfig({
	assetFileNames,
	minify: cssMinify,
	input,
	dir,
} = {
	assetFileNames: '[name][extname]',
	minify: false,
	dir: 'dist/assets',
	input: 'src/index.css',
}) {
	return defineConfig({
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
