import { copy } from 'fs-extra'
import { basename, join } from 'path'
import { resourcesDir } from '../pathUtils'
import { promises as fs } from 'fs'
import { listDirectories } from './fs'
import { InstanceEnvironment, validateInstanceName } from './instance'
import { updateYaml } from './yaml'

export const validateProjectName = (name: string) => {
	if (!name.match(/^[a-z][a-z0-9]*$/)) {
		throw new Error('Invalid project name. It can contain only alphanumeric letters and cannot start with a number')
	}
}
export const listProjects = async (args: { workspaceDirectory: string }) => {
	return (await listDirectories(join(args.workspaceDirectory, 'projects'))).map(it => basename(it))
}

export const createProject = async (args: { workspaceDirectory: string; projectName: string }) => {
	validateProjectName(args.projectName)
	const projectDir = join(args.workspaceDirectory, 'projects', args.projectName)
	await copy(join(resourcesDir, './project-template'), projectDir)
	const filesToReplace = ['admin/index.ts']
	for (const file of filesToReplace) {
		const path = join(projectDir, file)
		const content = await fs.readFile(path, { encoding: 'utf8' })
		const newContent = content.replace('{projectName}', args.projectName)
		await fs.writeFile(path, newContent, { encoding: 'utf8' })
	}
}

export const registerProjectToInstance = async (
	args: {
		projectName: string
	} & InstanceEnvironment,
) => {
	validateInstanceName(args.instanceName)
	validateProjectName(args.projectName)
	const path = join(args.instanceDirectory, 'admin/src/projects.ts')
	const code = `export { default as ${args.projectName} } from '../../../../projects/${args.projectName}/admin'\n`
	await fs.appendFile(path, code, { encoding: 'utf8' })
	const projectEnvName = args.projectName.toUpperCase()

	await updateYaml(join(args.instanceDirectory, 'api/config.yaml'), (config, { merge }) =>
		merge(config, {
			projects: [
				{
					slug: args.projectName,
					name: args.projectName,
					directory: `${args.projectName}/api`,
					stages: [{ slug: 'live', name: 'Live' }],
					dbCredentials: {
						host: `%env.${projectEnvName}_DB_HOST%`,
						port: `%env.${projectEnvName}_DB_PORT::number%`,
						user: `%env.${projectEnvName}_DB_USER%`,
						password: `%env.${projectEnvName}_DB_PASSWORD%`,
						database: `%env.${projectEnvName}_DB_NAME%`,
					},
					s3: {
						bucket: `%env.${projectEnvName}_S3_BUCKET%`,
						prefix: `%env.${projectEnvName}_S3_PREFIX%`,
						region: `%env.${projectEnvName}_S3_REGION%`,
						endpoint: `%env.${projectEnvName}_S3_ENDPOINT%`,
						credentials: {
							key: `%env.${projectEnvName}_S3_KEY%`,
							secret: `%env.${projectEnvName}_S3_SECRET%`,
						},
					},
				},
			],
		}),
	)
}

export const getProjectDockerEnv = (projectName: string, s3Endpoint: string): Record<string, string> => {
	const projectEnvName = projectName.toUpperCase()
	return {
		[`${projectEnvName}_DB_HOST`]: 'db',
		[`${projectEnvName}_DB_PORT`]: '5432',
		[`${projectEnvName}_DB_USER`]: 'contember',
		[`${projectEnvName}_DB_PASSWORD`]: 'contember',
		[`${projectEnvName}_DB_NAME`]: projectName,
		[`${projectEnvName}_S3_BUCKET`]: 'contember',
		[`${projectEnvName}_S3_PREFIX`]: projectName,
		[`${projectEnvName}_S3_REGION`]: '',
		[`${projectEnvName}_S3_ENDPOINT`]: s3Endpoint,
		[`${projectEnvName}_S3_KEY`]: 'contember',
		[`${projectEnvName}_S3_SECRET`]: 'contember',
	}
}
