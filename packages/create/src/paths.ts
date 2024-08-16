import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const packageRoot = process.env.CONTEMBER_CLI_PACKAGE_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../../')
export const resourcesDir = join(packageRoot, './resources')
