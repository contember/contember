import { join } from 'node:path'

export const packageRoot = process.env.CONTEMBER_CLI_PACKAGE_ROOT || join(__dirname, '../../')
export const resourcesDir = join(packageRoot, './resources')
