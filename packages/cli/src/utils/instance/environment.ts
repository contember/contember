import { Input } from '../../cli'
import { Workspace } from '../Workspace'
import { Instance } from './Instance'

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
	if (input.getOption('no-instance')) {
		return []
	} else if (input.getOption('instance')) {
		return await Promise.all(
			input.getOption('instance').map(instanceName => workspace.instances.getInstance(instanceName)),
		)
	} else if (input.getOption('all-instances')) {
		return await workspace.instances.listInstances()
	} else if (process.env.CONTEMBER_INSTANCE) {
		return [await workspace.instances.getInstance(process.env.CONTEMBER_INSTANCE)]
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
	const instanceName = input.getArgument('instanceName') || process.env.CONTEMBER_INSTANCE
	if (instanceName) {
		return await workspace.instances.getInstance(instanceName)
	}
	return await workspace.instances.getDefaultInstance()
}
