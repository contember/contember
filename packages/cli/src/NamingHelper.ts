export const getProjectDir = (projectName: string) => process.cwd() + '/projects/' + projectName + '/api/'
export const getProjectMigrationsDir = (projectName: string) => getProjectDir(projectName) + 'migrations'
