import { join } from 'path'
import { packageRoot } from '../pathUtils'
import { pathExists } from 'fs-extra'

export const getCliVersion = () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require(join(packageRoot, 'package.json')).version
}

export const getRequestedCliVersion = async (): Promise<string | undefined> => {
	const lockPath = join(process.cwd(), 'package-lock.json')
	if (!(await pathExists(lockPath))) {
		return undefined
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const lockfile = require(lockPath)
	return lockfile?.dependencies?.['@contember/cli']?.version
}
