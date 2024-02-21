import { createViteConfig } from '../../build/createViteConfig.js'

const currentDirName = new URL('.', import.meta.url).pathname.split('/').filter(Boolean).pop()

export default createViteConfig(currentDirName)
