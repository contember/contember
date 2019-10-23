import CommandConfiguration from '../cli/CommandConfiguration'
import Command from '../cli/Command'
import prompts from 'prompts'
import { Input } from '../cli/Input'
import { GraphQLClient } from 'graphql-request'

type Args = {
	apiUrl: string
}

class SetupCommand extends Command<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates superadmin and login key')
		configuration.argument('apiUrl').description('Contember API URL')
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const apiUrl = input.getArgument('apiUrl')

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

		const query = `mutation($email: String!, $password: String!) {
  setup(superadmin: {email: $email, password: $password}) {
    ok
    result {
      loginKey {
        token
      }
    }
  }
}`

		const client = new GraphQLClient(apiUrl + '/tenant', {
			headers: {
				Authorization: 'Bearer 12345123451234512345',
			},
		})
		const result = await client.request(query, { email, password })
		console.log('Superadmin created.')
		console.log('Login token:')
		console.log(result.setup.result.loginKey.token)
	}
}

export default SetupCommand
