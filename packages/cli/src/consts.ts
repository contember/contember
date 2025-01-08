import { findPackageRoot } from '@contember/cli-common'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = dirname(fileURLToPath(import.meta.url))
export const packageRoot = process.env.CONTEMBER_CLI_PACKAGE_ROOT || findPackageRoot(currentFilePath)
export const contemberDockerImages = ['contember/engine', 'contember/engine-ee', 'contember/cli']
