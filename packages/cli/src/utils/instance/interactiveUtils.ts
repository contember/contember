import { Input } from '../../cli'
import { getInstanceStatus, listInstances } from '../instance'
import prompts from 'prompts'
import { InstanceApiEnvironment, resolveInstanceEnvironment } from './enviornment'

export const interactiveResolveInstanceEnvironmentFromInput = async (
	inputCommand: Input<{
		instance?: string
	}>,
): Promise<InstanceApiEnvironment> => {
	const workspaceDirectory = process.cwd()
	let [instanceName] = [inputCommand.getArgument('instance') || process.env.CONTEMBER_INSTANCE]
	if (!instanceName) {
		const instances = await listInstances({ workspaceDirectory })
		;({ instanceName } = await prompts({
			type: 'select',
			message: 'Instance',
			name: 'instanceName',
			choices: [...instances.map(it => ({ value: it, title: it })), { value: '__remote', title: 'Remote API' }],
		}))
		if (instanceName === '__remote') {
			;({ instanceName } = await prompts({
				type: 'text',
				message: 'Remote API URL',
				name: 'instanceName',
			}))
		}
		if (!instanceName) {
			throw 'Please specify an instance'
		}
	}
	if (instanceName.includes('://')) {
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
	const instanceEnv = await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
	const instanceStatus = await getInstanceStatus(instanceEnv)
	const runningApi = instanceStatus.find(it => it.name === 'api' && it.running)
	if (!runningApi) {
		throw `Instance ${instanceName} is not running. Run instance:up first.`
	}
	const apiServer = `http://127.0.0.1:${runningApi.ports[0].hostPort}`
	return { type: 'local', ...instanceEnv, baseUrl: apiServer }
}
