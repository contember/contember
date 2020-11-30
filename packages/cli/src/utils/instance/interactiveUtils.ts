import { getInstanceStatus, InstanceLocalApiEnvironment, InstanceLocalEnvironment, listInstances } from '../instance'
import prompts from 'prompts'
import { InstanceApiEnvironment, resolveInstanceEnvironment } from './environment'

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

const createLocalInstanceEnvironment = async (
	instanceEnvironment: InstanceLocalEnvironment,
): Promise<InstanceLocalApiEnvironment> => {
	const instanceStatus = await getInstanceStatus(instanceEnvironment)
	const runningApi = instanceStatus.find(it => it.name === 'api' && it.running)
	if (!runningApi) {
		throw `Instance ${instanceEnvironment.instanceName} is not running. Run instance:up first.`
	}
	const apiServer = `http://127.0.0.1:${runningApi.ports[0].hostPort}`
	return { type: 'local', ...instanceEnvironment, baseUrl: apiServer }
}

export const interactiveResolveInstanceEnvironmentFromInput = async (
	instance?: string,
): Promise<InstanceApiEnvironment> => {
	const workspaceDirectory = process.cwd()
	let instanceName = instance || process.env.CONTEMBER_INSTANCE
	if (instanceName) {
		if (instanceName.includes('://')) {
			return createRemoteInstanceEnvironment(instanceName)
		} else {
			const instanceEnvironment = await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
			return await createLocalInstanceEnvironment(instanceEnvironment)
		}
	}
	const instances = await listInstances({ workspaceDirectory })
	const { instance: selectedInstance } = await prompts({
		type: 'select',
		message: 'Instance',
		name: 'instance',
		choices: [
			...instances.map(it => ({ value: it, title: it.instanceName })),
			{ value: '__remote', title: 'Remote API' },
		],
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
