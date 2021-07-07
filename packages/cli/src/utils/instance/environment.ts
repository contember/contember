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

export const getInstanceFromEnv = (allowRemote: boolean = true): string | undefined => {
	let instance = process.env.CONTEMBER_INSTANCE
	if (!allowRemote && instance && isRemoteInstance(instance)) {
		return undefined
	}
	return instance
}
