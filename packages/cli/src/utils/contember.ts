import { join } from 'path'
import { packageRoot } from '../pathUtils'

export const getCliVersion = () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require(join(packageRoot, 'package.json')).version
}
