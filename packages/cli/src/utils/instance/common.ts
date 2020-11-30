import { basename, join } from 'path'
import { listDirectories } from '../fs'
import { pathExists } from 'fs-extra'
import { InstanceLocalEnvironment, resolveInstanceEnvironment } from './environment'

export const validateInstanceName = (name: string) => {
	if (!name.match(/^[a-z][-_a-z0-9]*$/)) {
		throw 'Invalid instance name. It can contain only alphanumeric letters and cannot start with a number'
	}
}

export const listInstances = async ({
	workspaceDirectory,
}: {
	workspaceDirectory: string
}): Promise<InstanceLocalEnvironment[]> => {
	const instanceDir = join(workspaceDirectory, 'instances')
	if (!(await pathExists(instanceDir))) {
		// possibly single instance environment (todo: validate)
		return [
			{
				instanceName: basename(workspaceDirectory)
					.toLocaleLowerCase()
					.replace(/[^-_a-z0-9]/, ''),
				instanceDirectory: workspaceDirectory,
			},
		]
	}
	const instanceDirs = await listDirectories(instanceDir)
	return await Promise.all(
		instanceDirs.map(
			async it =>
				await resolveInstanceEnvironment({
					workspaceDirectory,
					instanceName: basename(it),
				}),
		),
	)
}

export const getDefaultInstance = async ({
	workspaceDirectory,
}: {
	workspaceDirectory: string
}): Promise<InstanceLocalEnvironment> => {
	const instances = await listInstances({ workspaceDirectory })
	if (instances.length !== 1) {
		throw 'Please specify an instance'
	}
	return instances[0]
}

export const getInstanceDir = (args: { workspaceDirectory: string; instanceName: string }): string =>
	join(args.workspaceDirectory, 'instances', args.instanceName)
