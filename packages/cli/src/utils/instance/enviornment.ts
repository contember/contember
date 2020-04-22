import { pathExists } from 'fs-extra'
import { Input } from '../../cli'
import { getDefaultInstance, getInstanceDir, listInstances, validateInstanceName } from './common'

export interface InstanceLocalEnvironment {
	instanceDirectory: string
	instanceName: string
}

interface BaseInstanceApiEnvironment {
	type: 'local' | 'remote'
	baseUrl: string
}

export interface InstanceLocalApiEnvironment extends InstanceLocalEnvironment, BaseInstanceApiEnvironment {
	type: 'local'
	baseUrl: string
}

export interface InstanceRemoteApiEnvironment extends BaseInstanceApiEnvironment {
	type: 'remote'
	baseUrl: string
}

export type InstanceApiEnvironment = InstanceLocalApiEnvironment | InstanceRemoteApiEnvironment

export const resolveInstanceEnvironment = async (args: {
	workspaceDirectory: string
	instanceName: string
}): Promise<InstanceLocalEnvironment> => {
	validateInstanceName(args.instanceName)
	const instanceDirectory = getInstanceDir(args)
	await verifyInstanceExists({ instanceDirectory, instanceName: args.instanceName })
	return { instanceName: args.instanceName, instanceDirectory }
}
const verifyInstanceExists = async ({
	instanceDirectory,
	instanceName,
}: {
	instanceDirectory: string
	instanceName: string
}) => {
	if (!(await pathExists(instanceDirectory))) {
		throw `Instance ${instanceName} not found.`
	}
}

export const resolveInstanceListEnvironmentFromInput = async ({
	input,
	workspaceDirectory,
}: {
	workspaceDirectory: string
	input: Input<
		{},
		{
			['all-instances']: boolean
			['no-instance']: boolean
			['instance']: string[]
		}
	>
}): Promise<InstanceLocalEnvironment[]> => {
	let instances: string[]
	if (input.getOption('no-instance')) {
		instances = []
	} else if (input.getOption('instance')) {
		instances = input.getOption('instance')
	} else if (input.getOption('all-instances')) {
		instances = await listInstances({ workspaceDirectory })
	} else if (process.env.CONTEMBER_INSTANCE) {
		instances = [process.env.CONTEMBER_INSTANCE]
	} else {
		instances = [await getDefaultInstance({ workspaceDirectory })]
	}
	return await Promise.all(
		instances.map(
			(instanceName): Promise<InstanceLocalEnvironment> =>
				resolveInstanceEnvironment({ instanceName, workspaceDirectory }),
		),
	)
}

export const resolveInstanceEnvironmentFromInput = async ({
	input,
	workspaceDirectory,
}: {
	input: Input<{
		instanceName?: string
	}>
	workspaceDirectory: string
}): Promise<InstanceLocalEnvironment> => {
	let [instanceName] = [
		input.getArgument('instanceName') ||
			process.env.CONTEMBER_INSTANCE ||
			(await getDefaultInstance({ workspaceDirectory })),
	]
	return await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
}
