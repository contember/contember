import prompts from 'prompts'
import { getInstanceFromEnv, InstanceApiEnvironment, InstanceLocalApiEnvironment } from './environment'
import { Instance } from './Instance'
import { Workspace } from '../Workspace'
import { isRemoteInstance } from './common'

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

const createLocalInstanceEnvironment = async (instance: Instance): Promise<InstanceLocalApiEnvironment> => {
	const instanceStatus = await instance.getStatus()
	const runningApi = instanceStatus.find(it => it.name === 'api' && it.running)
	if (!runningApi) {
		throw `Instance ${instance.name} is not running. Run instance:up first.`
	}
	const apiServer = `http://127.0.0.1:${runningApi.ports[0].hostPort}`
	return { type: 'local', baseUrl: apiServer, instanceName: instance.name, instanceDirectory: instance.directory }
}

export const interactiveResolveInstanceEnvironmentFromInput = async (
	workspace: Workspace,
	instance?: string,
): Promise<InstanceApiEnvironment> => {
	let instanceName = instance || getInstanceFromEnv()
	if (instanceName) {
		if (isRemoteInstance(instanceName)) {
			return createRemoteInstanceEnvironment(instanceName)
		} else {
			const instance = await workspace.instances.getInstance(instanceName)
			return await createLocalInstanceEnvironment(instance)
		}
	}
	const instances = await workspace.instances.listInstances()
	const { instance: selectedInstance } = await prompts({
		type: 'select',
		message: 'Instance',
		name: 'instance',
		choices: [...instances.map(it => ({ value: it, title: it.name })), { value: '__remote', title: 'Remote API' }],
	})
	if (!selectedInstance) {
		throw 'Please specify an instance'
	}
	if (selectedInstance === '__remote') {
		const { url } = await prompts({
			type: 'text',
			message: 'Remote API URL',
			name: 'url',
		})
		return createRemoteInstanceEnvironment(url)
	}
	return await createLocalInstanceEnvironment(selectedInstance)
}
