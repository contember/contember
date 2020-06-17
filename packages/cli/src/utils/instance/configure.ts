import { DockerComposeConfig, updateOverrideConfig } from '../dockerCompose'
import { readInstanceConfig, updateInstanceLocalConfig } from './config'
import { interactiveAskForCredentials } from '../tenant'
import { randomBytes } from '../random'
import {
	patchInstanceOverrideConfig,
	patchInstanceOverrideCredentials,
	resolvePortsMapping,
} from './dockerComposeConfig'

export const interactiveInstanceConfigure = async ({
	composeConfig,
	instanceDirectory,
	host,
	ports,
}: {
	composeConfig: DockerComposeConfig
	instanceDirectory: string
	host?: string[]
	ports?: number
}): Promise<{ adminEnv: Record<string, string> }> => {
	const withAdmin = !!composeConfig.services.admin
	const adminEnv = !withAdmin ? {} : { ...composeConfig.services.admin.environment }

	const instanceConfig = await readInstanceConfig({ instanceDirectory })

	if (!composeConfig.services.api?.ports) {
		const portsMapping = await resolvePortsMapping({
			instanceDirectory,
			config: composeConfig,
			host: host,
			startPort: ports,
		})
		await updateOverrideConfig(instanceDirectory, config => patchInstanceOverrideConfig(config, portsMapping))
	}

	if (!instanceConfig.loginToken && adminEnv.CONTEMBER_LOGIN_TOKEN) {
		await updateInstanceLocalConfig({
			instanceDirectory,
			updater: data => ({ ...data, loginToken: adminEnv.CONTEMBER_LOGIN_TOKEN }),
		})
	} else if (!instanceConfig.loginToken) {
		const { email: rootEmail, password: rootPassword } = await interactiveAskForCredentials()
		const loginToken = (await randomBytes(20)).toString('hex')
		const rootToken = (await randomBytes(20)).toString('hex')

		await updateOverrideConfig(instanceDirectory, config =>
			patchInstanceOverrideCredentials(config, { loginToken, rootToken, rootEmail, rootPassword }),
		)
		await updateInstanceLocalConfig({
			instanceDirectory: instanceDirectory,
			updater: json => ({ ...json, apiToken: rootToken, loginToken: loginToken }),
		})
		adminEnv.CONTEMBER_LOGIN_TOKEN = loginToken
	} else if (!adminEnv.CONTEMBER_LOGIN_TOKEN || !composeConfig.services.api?.environment?.CONTEMBER_LOGIN_TOKEN) {
		await updateOverrideConfig(instanceDirectory, config =>
			patchInstanceOverrideCredentials(config, { loginToken: instanceConfig.loginToken }),
		)
	}

	return { adminEnv }
}
