import { defineConfig } from 'vite'

const packagesDir = __dirname + '/../../../..'
const suffix = process.env.CI ? '' : '/src/index.ts'

export default defineConfig({
	esbuild: {
		jsxFactory: '_jsx',
		jsxFragment: '_jsxFragment',
		jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
	},
	build: {
		chunkSizeWarningLimit: undefined,
	},
	css: {
		preprocessorOptions: {
			sass: {
				charset: false,
			},
		},
	},
	resolve: {
		alias: [
			{ find: '@contember/admin', replacement: `${packagesDir}/admin${suffix}` },
			{ find: '@contember/admin-i18n', replacement: `${packagesDir}/admin-i18n${suffix}` },
			{ find: '@contember/admin-sandbox', replacement: `${packagesDir}/admin-sandbox${suffix}` },
			{ find: '@contember/binding', replacement: `${packagesDir}/binding${suffix}` },
			{ find: '@contember/client', replacement: `${packagesDir}/client${suffix}` },
			{ find: '@contember/react-client', replacement: `${packagesDir}/react-client${suffix}` },
			{ find: '@contember/react-multipass-rendering', replacement: `${packagesDir}/react-multipass-rendering${suffix}` },
			{ find: '@contember/react-utils', replacement: `${packagesDir}/react-utils${suffix}` },
			{ find: '@contember/ui', replacement: `${packagesDir}/ui${suffix}` },
			{ find: '@contember/vimeo-file-uploader', replacement: `${packagesDir}/vimeo-file-uploader${suffix}` },
		],
	},
	preview: {
		port: 3333,
	},
})
