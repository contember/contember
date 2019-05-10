import CommandConfiguration from '../core/cli/CommandConfiguration'
import Command from '../core/cli/Command'
import ApiKeyManager from '../tenant-api/model/service/ApiKeyManager'
import SignUpManager from '../tenant-api/model/service/SignUpManager'
import prompts from 'prompts'
import Identity from '../common/auth/Identity'

class SetupCommand extends Command<{}, {}> {
	constructor(private readonly signUpManager: SignUpManager, private readonly apiKeyManager: ApiKeyManager) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates superadmin and login key')
	}

	protected async execute(): Promise<void> {
		const { email, password } = await prompts([
			{
				type: 'text',
				name: 'email',
				message: 'Superadmin email',
			},
			{
				type: 'password',
				name: 'password',
				message: 'Superadmin password',
				validate: password => (password.length < 6 ? 'Password must contain at least 6 characters' : true),
			},
		])
		const result = await this.signUpManager.signUp(email, password, [Identity.SystemRole.SUPER_ADMIN])
		if (!result.ok) {
			throw new Error(result.errors.join(', '))
		}
		console.log('Superadmin created.')

		const loginKey = await this.apiKeyManager.createLoginApiKey()
		console.log('Login token:')
		console.log(loginKey.apiKey.token)
	}
}

export default SetupCommand
