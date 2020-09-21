import { pathExists } from 'fs-extra'
import { basename, join } from 'path'
import { resourcesDir } from '../pathUtils'
import { promises as fs } from 'fs'
import { listDirectories } from './fs'
import { updateYaml } from './yaml'
import { workspaceHasAdmin } from './workspace'
import { installTemplate } from './template'
import { InstanceLocalEnvironment, validateInstanceName } from './instance'
import { updateMainDockerComposeConfig } from './dockerCompose'

// do not forget to update packages/engine-common/src/config/Project.ts
export const projectNameToEnvName = (projectName: string): string => {
	return projectName.toUpperCase().replace(/-/g, '_')
}

export const validateProjectName = (name: string) => {
	if (!name.match(/^[a-z][-a-z0-9]*$/i)) {
		throw 'Invalid project name. It can contain only alphanumeric characters, dash and must start with a letter'
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
		const code = `export { default as ${args.projectName.replace('-', '_')} } from '../../../../projects/${
			args.projectName
		}/admin'\n`
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
	await updateMainDockerComposeConfig(args.instanceDirectory, (config: any) => ({
		...config,
		services: {
			...config.services,
			api: {
				...config.services.api,
				environment: {
					...config.services.api.environment,
					[projectNameToEnvName(args.projectName) + '_DB_NAME']: args.projectName,
				},
			},
		},
	}))
}
