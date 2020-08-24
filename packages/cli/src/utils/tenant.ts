import prompts from 'prompts'
import { GraphQLClient } from 'graphql-request'
import { InstanceApiEnvironment, readInstanceConfig } from './instance'

const validatePassword = (password: string) =>
	password.length < 6 ? 'Password must contain at least 6 characters' : true

export const createTenantApiUrl = (url: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}
	if (url.endsWith('/tenant')) {
		return url
	}
	return url + '/tenant'
}

export const interactiveResolveLoginToken = async (instance: InstanceApiEnvironment) => {
	if (process.env.CONTEMBER_LOGIN_TOKEN) {
		return process.env.CONTEMBER_LOGIN_TOKEN
	}
	if (instance.type === 'local') {
		const config = await readInstanceConfig(instance)
		if (config.loginToken) {
			return config.loginToken
		}
	}
	const { loginToken } = await prompts({
		type: 'text',
		name: 'loginToken',
		message: 'Login token',
	})
	return loginToken
}

export const interactiveSignIn = async ({
	apiUrl,
	loginToken,
	expiration,
}: {
	apiUrl: string
	loginToken: string
	expiration?: number
}): Promise<{ sessionToken: string }> => {
	const { email, password } = await prompts([
		{
			type: 'text',
			name: 'email',
			message: 'E-mail',
		},
		{
			type: 'password',
			name: 'password',
			message: 'Password',
		},
	])
	if (!expiration) {
		;({ expiration } = await prompts({
			type: 'number',
			name: 'expiration',
			message: 'Expiration in seconds',
			float: false,
			initial: 3600 * 365,
		}))
	}
	const client = TenantClient.create(apiUrl, loginToken)
	return await client.signIn(email, password, expiration || 3600)
}

export const interactiveAskForCredentials = async (): Promise<{ email: string; password: string }> => {
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
			validate: validatePassword,
		},
	])

	if (!email || !password) {
		throw 'Aborting a setup'
	}
	return { email, password }
}

export const setup = async (
	apiUrl: string,
	{ email, password }: { email: string; password: string },
): Promise<{ loginToken: string }> => {
	const client = TenantClient.create(apiUrl, '12345123451234512345')
	const response = await client.setup(email, password)
	console.log('Superadmin created.')
	console.log('Login token: ' + response.loginToken)
	return response
}

export const interactiveResolveApiToken = async ({
	instance,
}: {
	instance: InstanceApiEnvironment
}): Promise<string> => {
	if (process.env.CONTEMBER_API_TOKEN) {
		return process.env.CONTEMBER_API_TOKEN
	}
	if (instance.type === 'local') {
		const config = await readInstanceConfig(instance)
		if (config.apiToken) {
			return config.apiToken
		}
	}
	const { strategy } = await prompts({
		type: 'select',
		name: 'strategy',
		message: 'Authentication',
		choices: [
			{ value: 'signin', title: 'Sign in using email and password' },
			{ value: 'token', title: 'Enter an API token' },
		],
	})
	if (strategy === 'signin') {
		const loginToken = await interactiveResolveLoginToken(instance)
		return (await interactiveSignIn({ apiUrl: createTenantApiUrl(instance.baseUrl), loginToken, expiration: 60 * 5 }))
			.sessionToken
	}
	const { token } = await prompts({
		type: 'text',
		name: 'token',
		message: 'API token',
	})

	return token
}

export const interactiveInvite = async ({ client }: { client: TenantClient }): Promise<void> => {
	const { project, memberships } = await interactiveResolveMemberships({ client })

	const { email } = await prompts({
		name: 'email',
		type: 'text',
		validate: (value: string) => (value.includes('@') ? true : 'Not a valid e-mail'),
		message: 'User e-mail',
	})

	console.log(`email: ${email}`)
	console.log(`project: ${project.slug}`)
	console.log('memberships:')
	console.log(JSON.stringify(memberships, null, '  '))
	const { ok } = await prompts({
		name: 'ok',
		message: 'Are you sure you want to invite this user?',
		type: 'confirm',
		inactive: 'no, start again',
	})
	if (!ok) {
		return await interactiveInvite({ client })
	}

	await client.invite(email, project.slug, memberships)
}

export const interactiveCreateApiKey = async ({
	client,
}: {
	client: TenantClient
}): Promise<{ id: string; token: string }> => {
	const { project, memberships } = await interactiveResolveMemberships({ client })

	const { description } = await prompts({
		name: 'description',
		type: 'text',
		message: 'API key description (e.g. "a key for mobile app")',
	})

	console.log(`project: ${project.slug}`)
	console.log('memberships:')
	console.log(JSON.stringify(memberships, null, '  '))
	const { ok } = await prompts({
		name: 'ok',
		message: 'Are you sure you want to create this API key?',
		type: 'confirm',
		inactive: 'no, start again',
	})
	if (!ok) {
		return await interactiveCreateApiKey({ client })
	}

	return await client.createApiKey(project.slug, memberships, description)
}

const interactiveResolveMemberships = async ({
	client,
}: {
	client: TenantClient
}): Promise<{ project: Project; memberships: Membership[] }> => {
	const projects = await client.listProjects()
	const { projectSlug } = await prompts({
		type: 'select',
		message: 'Project',
		name: 'projectSlug',
		choices: projects.map(it => ({ value: it.slug, title: it.slug })),
	})
	const project = projects.find(it => it.slug === projectSlug)
	if (!project) {
		throw new Error()
	}
	const memberships: Membership[] = []
	let choices = project.roles.map(({ name }) => ({ value: name, title: name }))
	let another = false
	do {
		const { roleName } = await prompts({
			type: 'select',
			message: 'Role',
			name: 'roleName',
			choices: choices,
		})
		choices = choices.filter(it => it.value !== roleName)
		const role = project.roles.find(it => it.name === roleName)
		if (!role) {
			throw new Error()
		}
		const membership: Membership = { role: role.name, variables: [] }
		memberships.push(membership)
		for (const variable of role.variables) {
			const { values } = await prompts({
				type: 'list',
				message: `Values for ${variable.name} (comma separated)`,
				name: 'values',
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				separator: ',',
			})
			membership.variables.push({ name: variable.name, values })
		}
		if (choices.length) {
			;({ another } = await prompts({
				name: 'another',
				message: 'Do you want to add another role?',
				type: 'confirm',
				initial: false,
			}))
		} else {
			another = false
		}
	} while (another)
	return { project, memberships }
}

export const interactiveResetPassword = async ({
	apiUrl,
	loginToken,
}: {
	apiUrl: string
	loginToken: string
}): Promise<void> => {
	const { email } = await prompts([
		{
			type: 'text',
			name: 'email',
			message: 'E-mail',
		},
	])
	if (!email) {
		throw `Aborted`
	}
	const client = TenantClient.create(apiUrl, loginToken)
	await client.createResetPasswordRequest(email)
	console.log('A reset token has been sent to given email')

	const { token, password } = await prompts([
		{
			type: 'text',
			name: 'token',
			message: 'Token',
		},
		{
			type: 'password',
			name: 'password',
			message: 'Password',
			validate: validatePassword,
		},
	])
	if (!token || !password) {
		throw 'Aborted'
	}
	await client.resetPassword(token, password)

	console.log('Password reset successful. You can now login using a new password')
}

type MembershipVariable = {
	name: string
	values: string[]
}
type Membership = {
	role: string
	variables: MembershipVariable[]
}

interface Project {
	slug: string
	roles: {
		name: string
		variables: {
			name: string
		}[]
	}[]
}

export class TenantClient {
	constructor(private readonly apiClient: GraphQLClient) {}

	public static create(url: string, apiToken: string): TenantClient {
		const graphqlClient = new GraphQLClient(createTenantApiUrl(url), {
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
		})
		return new TenantClient(graphqlClient)
	}

	public async createApiKey(
		projectSlug: string,
		memberships: Membership[],
		description: string,
	): Promise<{ id: string; token: string }> {
		const query = `mutation($projectSlug: String!, $memberships: [MembershipInput!]!, $description: String!) {
  createApiKey(projectSlug: $projectSlug, memberships: $memberships, description: $description) {
    ok
    errors {
      code
    }
    result {
      apiKey {
        id
        token
      }
    }
  }
}`
		const response = await this.apiClient.request<{
			createApiKey: { ok: boolean; errors: { code: string }[]; result: { apiKey: { id: string; token: string } } }
		}>(query, { projectSlug, memberships, description })
		if (!response.createApiKey.ok) {
			throw response.createApiKey.errors.map((it: any) => it.code)
		}
		return response.createApiKey.result.apiKey
	}

	public async invite(email: string, projectSlug: string, memberships: Membership[]): Promise<void> {
		const query = `mutation($projectSlug: String!, $memberships: [MembershipInput!]!, $email: String!) {
  invite(projectSlug: $projectSlug, memberships: $memberships, email: $email) {
    ok
    errors {
      code
    }
  }
}`
		const response = await this.apiClient.request<{ invite: { ok: boolean; errors: { code: string }[] } }>(query, {
			projectSlug,
			memberships,
			email,
		})
		if (!response.invite.ok) {
			throw response.invite.errors.map((it: any) => it.code)
		}
	}

	public async listProjects(): Promise<Project[]> {
		const response = await this.apiClient.request<{
			me: { projects: { project: { slug: string; roles: { name: string; variables: { name: string }[] }[] } }[] }
		}>(`query {
  me {
    projects {
      project {
        slug
        roles {
          name
          variables {
            name
          }
        }
      }
    }
  }
}`)

		return response.me.projects.map((it: any) => it.project)
	}

	public async signIn(email: string, password: string, expiration: number): Promise<{ sessionToken: string }> {
		const query = `mutation($email: String!, $password: String!, $expiration: Int!) {
  signIn(email: $email, password: $password, expiration: $expiration) {
    ok
    errors {
      code
    }
    result {
      token
    }
  }
}`

		const result = await this.apiClient.request<{
			signIn: { ok: boolean; errors: { code: string }[]; result: { token: string } }
		}>(query, { email, password, expiration })
		if (!result.signIn.ok) {
			throw result.signIn.errors.map((it: any) => it.code)
		}
		return { sessionToken: result.signIn.result.token }
	}

	public async setup(email: string, password: string): Promise<{ loginToken: string }> {
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
		const result = await this.apiClient.request<{ setup: { ok: boolean; result: { loginKey: { token: string } } } }>(
			query,
			{ email, password },
		)
		const loginToken = result.setup.result.loginKey.token
		return { loginToken }
	}

	public async createResetPasswordRequest(email: string): Promise<void> {
		const query = `mutation($email: String!) {
  createResetPasswordRequest(email: $email) {
    ok
    errors {
      code
    }
  }
}`
		const result = await this.apiClient.request<{
			createResetPasswordRequest: { ok: boolean; errors: { code: string }[] }
		}>(query, { email })
		if (!result.createResetPasswordRequest.ok) {
			throw result.createResetPasswordRequest.errors.map((it: any) => it.code)
		}
	}

	public async resetPassword(token: string, password: string): Promise<void> {
		const query = `mutation($token: String!, $password: String!) {
  resetPassword(token: $token, password: $password) {
    ok
    errors {
      code
    }
  }
}`
		const result = await this.apiClient.request<{
			resetPassword: { ok: boolean; errors: { code: string }[] }
		}>(query, { token, password })
		if (!result.resetPassword.ok) {
			throw result.resetPassword.errors.map((it: any) => it.code)
		}
	}
}
