import { createViteConfig } from '../../scripts/vite/createViteConfig'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageName = basename(dirname(fileURLToPath(import.meta.url)))

export default createViteConfig(packageName)
