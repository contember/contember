import { defineConfig } from 'vite'

const packagesDir = __dirname + '/../../../..'

export default defineConfig({
	esbuild: {
		jsxFactory: '_jsx',
		jsxFragment: '_jsxFragment',
		jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
	},
	resolve: {
		alias: [
			{ find: '@contember/admin', replacement: `${packagesDir}/admin` },
			{ find: '@contember/admin-i18n', replacement: `${packagesDir}/admin-i18n` },
			{ find: '@contember/admin-sandbox', replacement: `${packagesDir}/admin-sandbox` },
			{ find: '@contember/binding', replacement: `${packagesDir}/binding` },
			{ find: '@contember/client', replacement: `${packagesDir}/client` },
			{ find: '@contember/react-client', replacement: `${packagesDir}/react-client` },
			{ find: '@contember/react-multipass-rendering', replacement: `${packagesDir}/react-multipass-rendering` },
			{ find: '@contember/react-utils', replacement: `${packagesDir}/react-utils` },
			{ find: '@contember/ui', replacement: `${packagesDir}/ui` },
			{ find: '@contember/vimeo-file-uploader', replacement: `${packagesDir}/vimeo-file-uploader` },
		],
	},
	preview: {
		port: 3333,
	},
})
