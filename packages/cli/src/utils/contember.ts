import { join } from 'path'
import { packageRoot } from '../pathUtils'

export const getContemberVersion = () => {
	return require(join(packageRoot, 'package.json')).version
}
