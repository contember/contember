import { join } from 'node:path'

export const packageRoot = process.env.CONTEMBER_CLI_PACKAGE_ROOT || join(__dirname, __dirname.endsWith('dist/src/lib') ? '../../../' : '../../')
export const resourcesDir = join(packageRoot, './resources')
