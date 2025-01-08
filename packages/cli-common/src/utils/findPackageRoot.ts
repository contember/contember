import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const findPackageRoot = (startPath: string) => {
	let currentPath = startPath

	while (true) {
		const packageJsonPath = join(currentPath, 'package.json')
		if (existsSync(packageJsonPath)) {
			return currentPath
		}

		const parentPath = dirname(currentPath)
		if (parentPath === currentPath) {
			throw new Error('Package root not found')
		}

		currentPath = parentPath
	}
}
