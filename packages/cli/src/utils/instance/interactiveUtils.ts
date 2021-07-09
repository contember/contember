import { getInstanceFromEnv, InstanceApiEnvironment, InstanceLocalApiEnvironment } from './environment'
import { Workspace } from '@contember/cli-common'
import { isRemoteInstance } from './common'
import { getServicesStatus } from './status'

const createRemoteInstanceEnvironment = (instanceName: string): InstanceApiEnvironment => {
	let baseUrl = instanceName
	if (baseUrl.endsWith('/')) {
		baseUrl = baseUrl.substring(0, baseUrl.length - 1)
	}
	if (baseUrl.endsWith('/tenant')) {
		console.warn('You should pass only base URL without /tenant suffix')
		baseUrl = baseUrl.substring(0, baseUrl.length - '/tenant'.length)
	}

	return { type: 'remote', baseUrl }
}

const createLocalInstanceEnvironment = async (workspace: Workspace): Promise<InstanceLocalApiEnvironment> => {
	const instanceStatus = await getServicesStatus(workspace)
	const runningApi = instanceStatus.find(it => it.name === 'contember') || instanceStatus.find(it => it.name === 'api')
	if (!runningApi || !runningApi.running) {
		throw `Instance ${workspace.name} is not running.`
	}
	const apiServer = `http://127.0.0.1:${runningApi.ports[0].hostPort}`
	return { type: 'local', baseUrl: apiServer, instanceName: workspace.name, instanceDirectory: workspace.directory }
}

export const interactiveResolveInstanceEnvironmentFromInput = async (
	workspace: Workspace,
	instance?: string,
	localOnly?: boolean,
): Promise<InstanceApiEnvironment> => {
	let instanceName = instance || getInstanceFromEnv()
	if (instanceName) {
		if (isRemoteInstance(instanceName)) {
			if (localOnly) {
				throw 'Remote instance is not supported'
			}
			return createRemoteInstanceEnvironment(instanceName)
		} else {
			if (workspace.name !== instanceName) {
				throw `Invalid instance name`
			}
			return await createLocalInstanceEnvironment(workspace)
		}
	}
	return await createLocalInstanceEnvironment(workspace)
}
