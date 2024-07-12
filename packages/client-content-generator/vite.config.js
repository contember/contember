import { createViteConfig } from '../../build/createViteConfig.js'
import { defineConfig } from 'vite'

export default defineConfig(args => {
	const config = createViteConfig('client-content-generator')(args)

	return {
		...config,
		build: {
			...config.build,
			rollupOptions: {
				...config.build.rollupOptions,
				input: {
					'index': './src/index.ts',
					'generate': './src/generate.ts',
				},
				output: [
					{
						format: 'esm',
						preserveModules: true,
						entryFileNames: '[name].js',
						banner: it => {
							if (it.name === 'generate') {
								return '#!/usr/bin/env node\n'
							}
							return ''
						},
					},
					{
						format: 'cjs',
						preserveModules: true,
						entryFileNames: '[name].cjs',
						banner: it => {
							if (it.name === 'generate') {
								return '#!/usr/bin/env node\n'
							}
							return ''
						},
					},
				],
				treeshake: {
					moduleSideEffects: false,
				},
			},
		},
	}
})

