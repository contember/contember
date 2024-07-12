import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
