import { basename, join } from 'path'
import { listDirectories } from '../fs'

export const instanceDirectoryToName = (instanceDirectory: string) =>
	basename(instanceDirectory)
		.toLocaleLowerCase()
		.replace(/[^-_a-z0-9]/, '')

export const validateInstanceName = (name: string) => {
	if (!name.match(/^[a-z][a-z0-9]*$/)) {
		throw 'Invalid instance name. It can contain only alphanumeric letters and cannot start with a number'
	}
}

export const listInstances = async (args: { workspaceDirectory: string }) => {
	return (await listDirectories(join(args.workspaceDirectory, 'instances'))).map(it => basename(it))
}

export const getDefaultInstance = async ({ workspaceDirectory }: { workspaceDirectory: string }): Promise<string> => {
	const instances = await listInstances({ workspaceDirectory })
	if (instances.length > 1) {
		throw 'Please specify an instance'
	}
	return instances[0]
}

export const getInstanceDir = (args: { workspaceDirectory: string; instanceName: string }): string =>
	join(args.workspaceDirectory, 'instances', args.instanceName)
