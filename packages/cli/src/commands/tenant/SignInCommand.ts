import { Command, CommandConfiguration, Input } from '../../cli'
import {
	interactiveResolveLoginToken,
	interactiveSignIn,
	interactiveResolveTenantInstanceEnvironmentFromInput,
} from '../../utils/tenant'
import prompt from 'prompts'
import { updateInstanceLocalConfig } from '../../utils/instance'

type Args = {
	instance?: string
}

type Options = {}

export class SignInCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Signs in a user')
		configuration
			.argument('instance')
			.optional()
			.description('Local instance name or remote Contember API URL')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		if (!process.stdin.isTTY) {
			throw 'This command is interactive and requires TTY'
		}
		const instance = await interactiveResolveTenantInstanceEnvironmentFromInput(input)
		const loginToken = await interactiveResolveLoginToken(instance)
		const token = await interactiveSignIn({ apiUrl: instance.url, loginToken })
		console.log('Session token:')
		console.log(token)
		if (instance.type === 'local') {
			const { save } = await prompt({
				type: 'confirm',
				initial: false,
				message: 'Save to contember.instance.local.yaml as a API token?',
				name: 'save',
			})
			if (save) {
				await updateInstanceLocalConfig({
					instanceDirectory: instance.instanceDirectory,
					updater: json => ({ ...json, apiToken: token }),
				})
			}
		}
	}
}
