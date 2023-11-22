import { createViteConfig } from '../../build/createViteConfig.js'
import { defineConfig } from 'vite'

export default defineConfig(args => {
	const config = createViteConfig('client-generator')(args)

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
			},
		},
	}
})

