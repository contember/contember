import sample from './sample'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
export { sample as sampleProject }

export const getExampleProjectDirectory = () => process.env.CONTEMBER_EXAMPLE_PROJECTS_DIRECTORY ?? join(dirname(fileURLToPath(import.meta.url)) + '/../../../src/projects')
