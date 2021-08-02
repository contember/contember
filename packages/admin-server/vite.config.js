import { defineConfig } from 'vite'
import { resolve } from "path";
import { rootDirectory } from "../../build/rootDirectory";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { packageList } from "../../build/packageList";

export default defineConfig(async ({ command, mode}) => ({
	build: {
		emptyOutDir: false,
		minify: mode === 'development' ? false : 'terser',
		outDir: resolve(rootDirectory, `packages/admin-server/dist`),
		assetsDir: '_static',
		sourcemap: mode === 'development' ? 'inline' : false,
		target: mode === 'development' ? 'esnext' : 'es2020',
	},
	esbuild: {
		jsxInject: `import * as React from 'react'`,
		target: 'esnext',
	},
	plugins: [reactRefresh()],
	resolve: {
		alias: [
			...packageList.map(packageName => ({
				find: `@contember/${packageName}`,
				replacement: resolve(rootDirectory, `packages/${packageName}/src/index.ts`),
			})),
			{
				find: 'attr-accept',
				replacement: resolve(rootDirectory, `packages/admin/node_modules/attr-accept/src/index.js`),
			},
		],
		dedupe: packageList.map(packageName => `@contember/${packageName}`),
	},
}))
