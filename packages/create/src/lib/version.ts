import { join } from 'node:path'
import fs from 'node:fs/promises'
import { packageRoot } from '../paths'

export const getPackageVersion = async () => {
	return JSON.parse(await fs.readFile(join(packageRoot, 'package.json'), 'utf-8')).version
}
