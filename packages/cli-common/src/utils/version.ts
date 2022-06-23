import { join } from 'path'
import { packageRoot } from '../pathUtils'
import fs from 'fs/promises'

export const getPackageVersion = async () => {
	return JSON.parse(await fs.readFile(join(packageRoot, 'package.json'), 'utf-8')).version
}
