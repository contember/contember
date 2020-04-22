import { copy, pathExists } from 'fs-extra'
import { basename, join } from 'path'
import { resourcesDir } from '../pathUtils'
import { promises as fs } from 'fs'
import { listDirectories, replaceFileContent } from './fs'
import { updateYaml } from './yaml'
import { projectNameToEnvName } from '@contember/engine-common'
import { workspaceHasAdmin } from './workspace'
import { installTemplate } from './template'
import { InstanceLocalEnvironment, validateInstanceName } from './instance'

export const validateProjectName = (name: string) => {
	if (!name.match(/^[a-z][-a-z0-9]*$/)) {
		throw 'Invalid project name. It can contain only alphanumeric letters, dash and must start with a letter'
	}
}
export const listProjects = async (args: { workspaceDirectory: string }) => {
	return (await listDirectories(join(args.workspaceDirectory, 'projects'))).map(it => basename(it))
}

export const createProject = async (args: { workspaceDirectory: string; projectName: string; template?: string }) => {
	validateProjectName(args.projectName)
	const projectDir = join(args.workspaceDirectory, 'projects', args.projectName)
	const withAdmin = await workspaceHasAdmin(args)
	const template =
		args.template ||
		(withAdmin ? '@contember/template-project-with-admin' : join(resourcesDir, 'templates/template-project'))
	await installTemplate(template, projectDir, 'project', { projectName: args.projectName })
}

export const registerProjectToInstance = async (
	args: {
		projectName: string
	} & InstanceLocalEnvironment,
) => {
	validateInstanceName(args.instanceName)
	validateProjectName(args.projectName)
	const path = join(args.instanceDirectory, 'admin/src/projects.ts')
	if (await pathExists(path)) {
		const code = `export { default as ${args.projectName} } from '../../../../projects/${args.projectName}/admin'\n`
		await fs.appendFile(path, code, { encoding: 'utf8' })
	}

	await updateYaml(join(args.instanceDirectory, 'api/config.yaml'), (config, { merge }) =>
		merge(config, {
			projects: {
				[args.projectName]: {
					stages: { live: null },
				},
			},
		}),
	)
}

export const getProjectDockerEnv = (projectName: string): Record<string, string> => {
	validateProjectName(projectName)
	const projectEnvName = projectNameToEnvName(projectName)
	return {
		[`${projectEnvName}_DB_NAME`]: projectName,
		[`${projectEnvName}_S3_PREFIX`]: projectName,
	}
}
