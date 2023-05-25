// @ts-check
/**
 * Maps package names to their parent directory
 *
 * @param {string} directory Parent directory
 * @param {string[]} packages Package name
 * @returns {[string, string][]}
 */
function directoryPackageEntry(directory, packages) {
	return packages.map(packageName => [packageName, `${directory}/${packageName}`])
}

export const list = {
	ee: [
		'admin-server',
	],
	packages: [
		'admin',
		'admin-i18n',
		'admin-sandbox',
		'binding',
		'brand',
		'client',
		'interface-tester',
		'layout',
		'react-auto',
		'react-binding',
		'react-binding-ui',
		'react-choice-field',
		'react-choice-field-ui',
		'react-client',
		'react-datagrid',
		'react-datagrid-ui',
		'react-form-fields-ui',
		'react-i18n',
		'react-leaflet-fields-ui',
		'react-multipass-rendering',
		'react-utils',
		'ui',
		'utilities',
		'vimeo-file-uploader',
		'vite-plugin',
	],
}

/**
 * @type {[string, string][]}
 **/
export const entries = Object.entries(list).flatMap(([directory, packages]) => {
	return directoryPackageEntry(directory, packages)
})
