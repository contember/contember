import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { getPackagePath, packageList } from './packageList.js'
import { rootDirectory } from './rootDirectory.js'

export function createViteConfig(packageName) {
	if (!packageList.includes(packageName)) {
		throw new Error(`Invalid package name ${packageName}.`)
	}

	const packageDir = `packages/${packageName}`

	return defineConfig(({ command, mode }) => {
		return {
			build: {
				lib: {
					entry: resolve(rootDirectory, `${packageDir}/src/index.ts`),
					formats: ['es'],
				},
				minify: false,
				outDir: resolve(rootDirectory, `${packageDir}/dist/${mode}`),
				rollupOptions: {
					external: (id, importer, resolved) => {
						return !resolved && !id.startsWith('./') && !id.startsWith('../') && id !== '.'
					},
					output: {
						preserveModules: true,
						entryFileNames: '[name].js',
					},
					treeshake: {
						moduleSideEffects: false,
					},
				},
				sourcemap: true,
				target: 'es2020',
			},
			esbuild: {
				jsxFactory: '_jsx',
				jsxFragment: '_jsxFragment',
				jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
			},
			plugins: [reactRefresh()],
			resolve: {
				alias: packageList.map(packageName => ({
					find: `@contember/${packageName}`,
					replacement: resolve(rootDirectory, getPackagePath(packageName)),
				})),
				dedupe: packageList.map(packageName => `@contember/${packageName}`),
			},
			css: {
				preprocessorOptions: {
					sass: {
						charset: false,
						additionalData: `$inter-font-path: '/@fs/src/packages/ui/src/assets/Inter'\n`,
					},
				},
			},
		}
	})
}
