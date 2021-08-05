import { defineConfig } from 'vite'
import { resolve } from 'path';
import { rootDirectory } from '../../build/rootDirectory'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { packageList } from "../../build/packageList";

export default defineConfig(async ({ command, mode }) => ({
	build: {
		minify: mode === 'development' ? false : 'terser',
		outDir: resolve(rootDirectory, `packages/admin-server/dist`),
		assetsDir: '_static',
		sourcemap: true,
		target: 'es2020',
	},
	plugins: [reactRefresh()],
	resolve: {
		alias: [
			...packageList.map(packageName => ({
				find: `@contember/${packageName}`,
				replacement: resolve(rootDirectory, `packages/${packageName}/src/index.ts`),
			})),
		],
	},
}))
