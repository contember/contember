import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const packageRoot =
	process.env.CONTEMBER_CLI_PACKAGE_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../../')
export const resourcesDir = join(packageRoot, './resources')
