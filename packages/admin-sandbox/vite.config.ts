import { defineConfig } from 'vite'
import { resolve } from 'path'
import { getPackagePath, packageList } from '../../build/packageList.js'
import { rootDirectory } from '../../build/rootDirectory.js'
import react from '@vitejs/plugin-react'

export default defineConfig({
	root: 'admin',
	plugins: [react()],
	resolve: {
		alias: packageList.map(packageName => ({
			find: `@contember/${packageName}`,
			replacement: resolve(rootDirectory, getPackagePath(packageName)),
		})),
	},
	css: {
		preprocessorOptions: {
			sass: {
				charset: false,
			},
		},
	},
})
