import { join } from 'path'
import { packageRoot } from '../pathUtils'

export const getContemberVersion = () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require(join(packageRoot, 'package.json')).version
}
