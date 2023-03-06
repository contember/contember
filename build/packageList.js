export const packageList = [
	'admin',
	'admin-i18n',
	'admin-sandbox',
	'admin-server',
	'binding',
	'client',
	'react-client',
	'react-multipass-rendering',
	'react-utils',
	'ui',
	'vimeo-file-uploader',
	'vite',
]

export const getPackagePath = name => {
	switch (name) {
		case 'admin-server':
			return `ee/${name}/src`
		default:
			return `packages/${name}/src`
	}
}
