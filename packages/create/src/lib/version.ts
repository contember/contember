import { join } from 'node:path'
import { packageRoot } from '../paths'

export const getPackageVersion = (): string => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require(join(packageRoot, 'package.json')).version
}
