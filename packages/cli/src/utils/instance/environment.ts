import { Input } from '../../cli'
import { Workspace } from '../Workspace'
import { Instance } from './Instance'
import { isRemoteInstance } from './common'

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

export const resolveInstanceListEnvironmentFromInput = async ({
	input,
	workspace,
}: {
	workspace: Workspace
	input: Input<
		{},
		{
			['all-instances']: boolean
			['no-instance']: boolean
			['instance']: string[]
		}
	>
}): Promise<Instance[]> => {
	const instanceFromEnv = getInstanceFromEnv(false)
	if (input.getOption('no-instance')) {
		return []
	} else if (input.getOption('instance')) {
		return await Promise.all(
			input.getOption('instance').map(instanceName => workspace.instances.getInstance(instanceName)),
		)
	} else if (input.getOption('all-instances')) {
		return await workspace.instances.listInstances()
	} else if (instanceFromEnv) {
		return [await workspace.instances.getInstance(instanceFromEnv)]
	} else {
		return [await workspace.instances.getDefaultInstance()]
	}
}

export const resolveInstanceEnvironmentFromInput = async ({
	input,
	workspace,
}: {
	input: Input<{
		instanceName?: string
	}>
	workspace: Workspace
}): Promise<Instance> => {
	const instanceName = input.getArgument('instanceName') || getInstanceFromEnv(false)
	if (instanceName) {
		return await workspace.instances.getInstance(instanceName)
	}
	return await workspace.instances.getDefaultInstance()
}

export const getInstanceFromEnv = (allowRemote: boolean = true): string | undefined => {
	let instance = process.env.CONTEMBER_INSTANCE
	if (!allowRemote && instance && isRemoteInstance(instance)) {
		return undefined
	}
	return instance
}
