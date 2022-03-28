import sample from './sample'
export { sample as sampleProject }

export const getExampleProjectDirectory = () => process.env.CONTEMBER_EXAMPLE_PROJECTS_DIRECTORY ?? __dirname + '/../../../src/projects'
