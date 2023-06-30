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
		'react-client',
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
