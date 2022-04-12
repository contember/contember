import { InstanceApiEnvironment } from './environment'
import { Workspace } from '@contember/cli-common'
import prompts from 'prompts'

const createRemoteInstanceEnvironment = (instanceName: string): InstanceApiEnvironment => {
	let baseUrl = instanceName
	if (baseUrl.endsWith('/')) {
		baseUrl = baseUrl.substring(0, baseUrl.length - 1)
	}
	if (baseUrl.endsWith('/tenant')) {
		console.warn('You should pass only base URL without /tenant suffix')
		baseUrl = baseUrl.substring(0, baseUrl.length - '/tenant'.length)
	}

	return { baseUrl }
}

export const interactiveResolveInstanceEnvironmentFromInput = async (
	workspace: Workspace,
	instance?: string,
): Promise<InstanceApiEnvironment> => {
	let instanceName =
		instance ||
		workspace.env.apiUrl ||
		(
			await prompts({
				type: 'text',
				name: 'instance',
				message: 'Instance URL',
			})
		).instance
	if (!instanceName) {
		throw `Please provide an instance URL`
	}
	if (!instanceName.includes('://')) {
		throw `Invalid instance URL "${instanceName}"`
	}
	return createRemoteInstanceEnvironment(instanceName)
}
