import { DockerComposeConfig, updateOverrideConfig } from '../dockerCompose'
import { updateInstanceLocalConfig } from './config'
import { interactiveAskForCredentials } from '../tenant'
import { randomBytes } from '../random'
import {
	patchInstanceOverrideConfig,
	patchInstanceOverrideCredentials,
	resolvePortsMapping,
} from './dockerComposeConfig'
import { Instance } from '../Instance'

export const interactiveInstanceConfigure = async ({
	composeConfig,
	instance,
	host,
	ports,
}: {
	composeConfig: DockerComposeConfig
	instance: Instance
	host?: string[]
	ports?: number
}): Promise<{ adminEnv: Record<string, string> }> => {
	const withAdmin = !!composeConfig.services.admin
	const adminEnv = !withAdmin ? {} : { ...composeConfig.services.admin.environment }

	const instanceConfig = await instance.config

	if (!composeConfig.services.api?.ports) {
		const portsMapping = await resolvePortsMapping({
			instanceDirectory: instance.directory,
			config: composeConfig,
			host: host,
			startPort: ports,
		})
		await updateOverrideConfig(instance.directory, config => patchInstanceOverrideConfig(config, portsMapping))
	}

	if (!instanceConfig.loginToken && adminEnv.CONTEMBER_LOGIN_TOKEN) {
		await updateInstanceLocalConfig({
			instanceDirectory: instance.directory,
			updater: data => ({ ...data, loginToken: adminEnv.CONTEMBER_LOGIN_TOKEN }),
		})
	} else if (!instanceConfig.loginToken) {
		const { email: rootEmail, password: rootPassword } = await interactiveAskForCredentials()
		const loginToken = (await randomBytes(20)).toString('hex')
		const rootToken = (await randomBytes(20)).toString('hex')

		await updateOverrideConfig(instance.directory, config =>
			patchInstanceOverrideCredentials(config, { loginToken, rootToken, rootEmail, rootPassword }),
		)
		await updateInstanceLocalConfig({
			instanceDirectory: instance.directory,
			updater: json => ({ ...json, apiToken: rootToken, loginToken: loginToken }),
		})
		adminEnv.CONTEMBER_LOGIN_TOKEN = loginToken
	} else if (!adminEnv.CONTEMBER_LOGIN_TOKEN || !composeConfig.services.api?.environment?.CONTEMBER_LOGIN_TOKEN) {
		await updateOverrideConfig(instance.directory, config =>
			patchInstanceOverrideCredentials(config, { loginToken: instanceConfig.loginToken }),
		)
	}

	return { adminEnv }
}
