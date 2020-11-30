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
	if (input.getOption('no-instance')) {
		return []
	} else if (input.getOption('instance')) {
		return await Promise.all(
			input.getOption('instance').map(instanceName => resolveInstanceEnvironment({ workspaceDirectory, instanceName })),
		)
	} else if (input.getOption('all-instances')) {
		return await listInstances({ workspaceDirectory })
	} else if (process.env.CONTEMBER_INSTANCE) {
		return [await resolveInstanceEnvironment({ workspaceDirectory, instanceName: process.env.CONTEMBER_INSTANCE })]
	} else {
		return [await getDefaultInstance({ workspaceDirectory })]
	}
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
	const instanceName = input.getArgument('instanceName') || process.env.CONTEMBER_INSTANCE
	if (instanceName) {
		return await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
	}
	return await getDefaultInstance({ workspaceDirectory })
}
