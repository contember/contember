import prompts from 'prompts'
import { GraphQLClient } from 'graphql-request'

export const interactiveSetup = async (apiUrl: string): Promise<{ loginToken: string }> => {
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
	const loginToken = result.setup.result.loginKey.token
	return { loginToken }
}
